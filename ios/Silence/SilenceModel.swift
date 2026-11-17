import SwiftUI

/// The screen's state: what's playing, the timer, the volume and your sound.
/// Settings are kept on the phone only (UserDefaults); nothing leaves it.
@MainActor
@Observable
final class SilenceModel {
    static let timerOptions: [Int?] = [nil, 30, 60, 90]

    private(set) var playing: Sound?
    private(set) var last: Sound?
    private(set) var preparing: Sound?
    private(set) var remaining: Double?
    var audioError = false
    var volume: Double = 1 {
        didSet { player.setVolume(Float(volume)); store.set(volume, forKey: "volume") }
    }
    var timerMinutes: Int? {
        didSet { player.setTimer(timerMinutes); store.set(timerMinutes ?? 0, forKey: "timerMinutes"); tick() }
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

    // Matching (the sheet)
    private(set) var matching = false
    var matchHz: Double = 4000 { didSet { if matching { player.setMatch(hz: matchHz, levelDB: matchLevelDB) } } }
    var matchLevelDB: Double = -50 { didSet { if matching { player.setMatch(hz: matchHz, levelDB: matchLevelDB) } } }

    @ObservationIgnored private let store = UserDefaults.standard
    private let player = NoisePlayer()
    private var ticker: Timer?

    init() {
        if store.object(forKey: "volume") != nil { volume = store.double(forKey: "volume") }
        let mins = store.integer(forKey: "timerMinutes"); timerMinutes = mins > 0 ? mins : nil
        tone = store.double(forKey: "tone")
        let hz = store.double(forKey: "matchedHz"); matchedHz = hz > 0 ? hz : nil
        focusOn = store.bool(forKey: "focusOn")
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
        audioError = false
        if matching { endMatching() }
        last = sound
        store.set(sound.rawValue, forKey: "last")
        preparing = sound
        Task {
            do {
                try await player.play(sound, title: String(localized: sound.nameKey), timerMinutes: timerMinutes)
                guard preparing == sound else { return }   // another tap came first
                preparing = nil
                playing = sound
                startTicker()
            } catch {
                preparing = nil
                audioError = true
            }
        }
    }

    func stop() {
        player.stop()
        didStop()
    }

    // MARK: Matching

    func beginMatching() {
        if playing != nil { stop() }
        matchHz = matchedHz ?? 4000
        matchLevelDB = -50            // always start very quietly
        do {
            try player.startMatching(hz: matchHz, levelDB: matchLevelDB)
            matching = true
        } catch {
            audioError = true
        }
    }

    func endMatching() {
        guard matching else { return }
        matching = false
        player.stopMatching()
    }

    /// Keep the pitch you landed on and turn the focus on.
    func useMatchedPitch() {
        matchedHz = matchHz
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
