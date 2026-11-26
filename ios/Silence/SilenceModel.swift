import SwiftUI

/// The screen's state: what's playing, the timer, the volume and your sound.
/// Settings are kept on the phone only (UserDefaults); nothing leaves it.
///
/// There is one, `shared`: the screen, Siri, Shortcuts and the Control Centre
/// button all use it, so they drive the same player and see the same state.
@MainActor
@Observable
final class SilenceModel {
    static let shared = SilenceModel()

    static let timerOptions: [Int?] = [nil, 30, 60, 90]

    /// The picker's choices, plus the current timer if Siri or Shortcuts set
    /// one that isn't among them (e.g. 45 minutes).
    static func timerOptions(including current: Int?) -> [Int?] {
        guard let current, !timerOptions.contains(current) else { return timerOptions }
        return (timerOptions + [current]).sorted { ($0 ?? 0) < ($1 ?? 0) }
    }

    private(set) var playing: Sound?
    private(set) var last: Sound?
    private(set) var preparing: Sound?
    private(set) var remaining: Double?
    var audioError = false
    var volume: Double = 1 {
        didSet { player.setVolume(Float(volume)); store.set(volume, forKey: "volume") }
    }
    var timerMinutes: Int? {
        didSet {
            player.setTimer(timerMinutes); store.set(timerMinutes ?? 0, forKey: "timerMinutes")
            tick(); updateActivity()
        }
    }

    // Your sound
    /// −1 darker … 1 brighter
    var tone: Double = 0 {
        didSet { player.setTone(tone); store.set(tone, forKey: "tone") }
    }
    /// The pitch you matched to your tinnitus (Hz), or nil
    private(set) var matchedHz: Double? {
        didSet { store.set(matchedHz ?? 0, forKey: "matchedHz"); applyFocus() }
    }
    /// Lift the sound around the matched pitch
    var focusOn = false {
        didSet { store.set(focusOn, forKey: "focusOn"); applyFocus() }
    }

    // Matching (the sheet). Limits from shared/silence-pitch-spec.json (PitchSpec).
    private(set) var matching = false
    var matchHz: Double = PitchSpec.shared.startHz {
        didSet {
            let clamped = PitchSpec.shared.clampHz(matchHz)
            if clamped != matchHz { matchHz = clamped }   // keep it in range
            updateMatch()
        }
    }
    var matchLevelDB: Double = PitchSpec.shared.levelStartDb {
        didSet {
            let clamped = PitchSpec.shared.clampLevel(matchLevelDB)
            if clamped != matchLevelDB { matchLevelDB = clamped }
            updateMatch()
        }
    }
    /// The sound to compare with your tinnitus: a tone or a hiss. Remembered.
    var matchSound: MatchSound = .tone {
        didSet { store.set(matchSound.rawValue, forKey: "matchSound"); updateMatch() }
    }

    @ObservationIgnored private let store = UserDefaults.standard
    private let player = NoisePlayer()
    private let activity = SleepTimerActivity()
    private var ticker: Timer?

    private init() {
        if store.object(forKey: "volume") != nil { volume = store.double(forKey: "volume") }
        let mins = store.integer(forKey: "timerMinutes"); timerMinutes = mins > 0 ? mins : nil
        tone = store.double(forKey: "tone")
        let hz = store.double(forKey: "matchedHz"); matchedHz = hz > 0 ? hz : nil
        focusOn = store.bool(forKey: "focusOn")
        matchSound = store.string(forKey: "matchSound").flatMap(MatchSound.init(rawValue:)) ?? .tone
        if let s = store.string(forKey: "last") { last = Sound(rawValue: s) }
        player.setVolume(Float(volume))
        player.setTone(tone)
        applyFocus()

        player.onStopped = { [weak self] in self?.didStop() }
        player.onRemotePlay = { [weak self] in
            guard let self else { return }
            self.start(self.last ?? .brown)
        }
    }

    func toggle(_ sound: Sound) {
        if playing == sound { stop() } else { start(sound) }
    }

    func start(_ sound: Sound) {
        Task { await play(sound) }
    }

    /// Start a sound and wait until it plays. False if the audio couldn't start.
    @discardableResult
    func play(_ sound: Sound) async -> Bool {
        audioError = false
        if matching { endMatching() }
        last = sound
        store.set(sound.rawValue, forKey: "last")
        preparing = sound
        do {
            try await player.play(sound, title: String(localized: sound.nameKey), timerMinutes: timerMinutes)
            guard preparing == sound else {
                // Stopped while it was starting: don't leave it playing unseen
                if preparing == nil && playing == nil { player.stop() }
                return true                                  // or another tap came first
            }
            preparing = nil
            playing = sound
            startTicker()
            updateActivity()
            return true
        } catch {
            preparing = nil
            audioError = true
            return false
        }
    }

    func stop() {
        player.stop()
        didStop()
    }

    /// Stop the sound and the matching tone (Siri, Shortcuts, the lock screen).
    func stopEverything() {
        endMatching()
        if playing != nil || preparing != nil || player.isRunning { stop() }
        preparing = nil
    }

    /// The Control Centre button: stop if playing, otherwise play the last sound.
    func playOrStop() async throws {
        if playing != nil || preparing != nil {
            stopEverything()
        } else {
            guard await play(last ?? .brown) else { throw SilenceIntentError() }
        }
    }

    // MARK: Matching

    func beginMatching() {
        matchHz = matchedHz ?? PitchSpec.shared.startHz
        matchLevelDB = PitchSpec.shared.levelStartDb   // always start very quietly
        startMatchSound()
    }

    /// The octave check: play the sound at `hz`, at the level already set.
    func playMatch(at hz: Double) {
        matchHz = hz
        if !matching { startMatchSound() }
    }

    private func startMatchSound() {
        if playing != nil { stop() }
        do {
            try player.startMatching(hz: matchHz, levelDB: matchLevelDB, sound: matchSound)
            matching = true
        } catch {
            audioError = true
        }
    }

    private func updateMatch() {
        if matching { player.setMatch(hz: matchHz, levelDB: matchLevelDB, sound: matchSound) }
    }

    func endMatching() {
        guard matching else { return }
        matching = false
        player.stopMatching()
    }

    /// Keep the pitch you landed on (or `hz`, from the octave check) and turn the focus on.
    func useMatchedPitch(_ hz: Double? = nil) {
        matchedHz = PitchSpec.shared.clampHz(hz ?? matchHz)
        focusOn = true
        endMatching()
    }

    func forgetMatch() {
        matchedHz = nil
        focusOn = false
    }

    private func applyFocus() {
        player.setFocus(hz: focusOn ? matchedHz : nil)
    }

    private func didStop() {
        playing = nil
        remaining = nil
        ticker?.invalidate()
        ticker = nil
        activity.end()
    }

    /// The lock-screen countdown: shown while a sound plays with a timer.
    private func updateActivity() {
        guard let playing, let secs = player.secondsRemaining else { activity.end(); return }
        activity.show(soundName: String(localized: playing.nameKey),
                      endDate: SleepTimerActivity.endDate(now: .now, secondsRemaining: secs))
    }

    // Once a second: the countdown, and stopping when the timer has run out
    private func startTicker() {
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        tick()
    }

    private func tick() {
        guard playing != nil else { remaining = nil; return }
        if player.timerFinished { stop(); return }
        remaining = player.secondsRemaining
    }
}

extension Sound {
    var nameKey: LocalizedStringResource {
        switch self {
        case .brown: "Brown noise"
        case .pink: "Pink noise"
        case .rain: "Rain"
        case .ocean: "Ocean"
        }
    }
    var descriptionKey: LocalizedStringResource {
        switch self {
        case .brown: "A deep, low rumble."
        case .pink: "Softer and more even than white noise."
        case .rain: "Patter of rain over a low rumble."
        case .ocean: "Waves rolling in, about every 10 to 14 seconds."
        }
    }
}
