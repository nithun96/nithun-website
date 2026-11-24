// Blanketing Silence — player
//
// Plays one 100-second loop per sound through AVAudioEngine. The loop is read
// by an AVAudioSourceNode, which also applies the volume and the sleep timer's
// fade sample by sample — the same idea as the website's audio-clock timer, so
// the fade is exact and runs while the phone is locked.
//
// The app asks for the "playback" audio session: the silent switch doesn't mute
// it, it keeps playing when locked (UIBackgroundModes: audio) and it shows
// lock-screen controls.
//
// Your sound: the loop passes through an EQ that tilts it darker or brighter and,
// optionally, lifts the band around the pitch you matched to your tinnitus. A
// separate quiet sine tone is used only while matching.

import AVFoundation
import MediaPlayer

enum Sound: String, CaseIterable, Identifiable {
    case brown, pink, rain, ocean
    var id: String { rawValue }
}

/// What the render thread reads. Written from the main thread, read on the audio
/// thread without a lock: single aligned word writes, accepted for v1.
/// TODO: move to Synchronization.Atomic when the minimum is iOS 18.
private final class RenderState {
    var samples: [Float] = []
    var position = 0
    var framesPlayed: Int64 = 0
    var fadeStart: Int64 = .max     // frame where the sleep timer's fade begins
    var fadeEnd: Int64 = .max       // frame where it reaches silence
    var volume: Float = 1
    var gain: Float = 0             // smoothed volume × fade (no clicks)
    var smoothing: Float = 0.9995
}

/// The matching tone, read on the audio thread (same caveat as RenderState).
private final class ToneState {
    var targetHz = 1000.0
    var hz = 1000.0
    var phase = 0.0
    var targetAmplitude: Float = 0
    var amplitude: Float = 0
}

@MainActor
final class NoisePlayer {
    static let fadeSecs = 60

    private let engine = AVAudioEngine()
    private let state = RenderState()
    private var source: AVAudioSourceNode?
    private let eq = AVAudioUnitEQ(numberOfBands: 3)   // 0 low shelf, 1 high shelf, 2 focus
    private let tone = ToneState()
    private var toneNode: AVAudioSourceNode?
    private var rate = 48000
    private var cached: (sound: Sound, rate: Int, samples: [Float])?

    /// Called when playback stops by itself (timer, interruption, headphones out).
    var onStopped: (() -> Void)?
    /// Called when the lock screen asks to play again.
    var onRemotePlay: (() -> Void)?

    init() {
        let low = eq.bands[0], high = eq.bands[1], focus = eq.bands[2]
        low.filterType = .lowShelf;   low.frequency = 300;   low.bypass = false
        high.filterType = .highShelf; high.frequency = 3000; high.bypass = false
        focus.filterType = .parametric; focus.bandwidth = 1; focus.gain = 6; focus.bypass = true
        engine.attach(eq)
        engine.connect(eq, to: engine.mainMixerNode, format: nil)
        observeSession()
        setUpRemoteCommands()
    }

    // MARK: Playing

    /// Start a sound. Makes the loop first if needed (about a second).
    func play(_ sound: Sound, title: String, timerMinutes: Int?) async throws {
        try activateSession()

        let samples: [Float]
        if let c = cached, c.sound == sound, c.rate == rate {
            samples = c.samples
        } else {
            let r = rate
            samples = await Task.detached(priority: .userInitiated) { NoiseRecipes.makeLoop(sound, rate: r) }.value
            cached = (sound, rate, samples)
        }

        engine.stop()                       // the render thread is idle while we swap
        attachSourceIfNeeded()
        state.samples = samples
        state.position = 0
        state.framesPlayed = 0
        state.gain = 0                      // fades in over ~50 ms
        applyTimer(timerMinutes)
        try engine.start()
        setNowPlaying(title: title)
    }

    private func activateSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default)
        try session.setActive(true)
        rate = Int(session.sampleRate.rounded())
    }

    func stop() {
        engine.stop()
        state.samples = []
        clearNowPlaying()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    var isRunning: Bool { engine.isRunning && !state.samples.isEmpty }

    // MARK: Volume and timer

    func setVolume(_ v: Float) { state.volume = v }

    /// Set or clear the sleep timer (minutes, or nil).
    func setTimer(_ minutes: Int?) { applyTimer(minutes) }

    /// Seconds until the sound stops, or nil.
    var secondsRemaining: Double? {
        guard state.fadeEnd != .max else { return nil }
        return max(0, Double(state.fadeEnd - state.framesPlayed) / Double(rate))
    }

    /// True once the timer has run out; the model then calls stop().
    var timerFinished: Bool { state.fadeEnd != .max && state.framesPlayed >= state.fadeEnd }

    private func applyTimer(_ minutes: Int?) {
        guard let minutes else { state.fadeStart = .max; state.fadeEnd = .max; return }
        let end = state.framesPlayed + Int64(minutes * 60 * rate)
        state.fadeStart = max(state.framesPlayed, end - Int64(Self.fadeSecs * rate))
        state.fadeEnd = end
    }

    // MARK: Your sound

    /// Tilt the sound: −1 darker … 0 as made … 1 brighter (±6 dB shelves).
    /// Applied live, so moving the slider is instant.
    func setTone(_ t: Double) {
        let db = Float(max(-1, min(1, t)) * 6)
        eq.bands[0].gain = -db
        eq.bands[1].gain = db
        updateHeadroom()
    }

    /// Lift the octave around your matched pitch by 6 dB, or nil for off.
    func setFocus(hz: Double?) {
        if let hz { eq.bands[2].frequency = Float(hz) }
        eq.bands[2].bypass = hz == nil
        updateHeadroom()
    }

    /// Boosts could push peaks past full scale; take some level back.
    private func updateHeadroom() {
        let boost = max(0, eq.bands[1].gain, eq.bands[0].gain)
        eq.globalGain = -(boost / 2) - (eq.bands[2].bypass ? 0 : 4)
    }

    // MARK: Matching your tinnitus

    /// Start the matching tone. Stop any sound first. It starts very quietly.
    func startMatching(hz: Double, levelDB: Double) throws {
        try activateSession()
        engine.stop()
        attachToneIfNeeded()
        tone.amplitude = 0
        setMatch(hz: hz, levelDB: levelDB)
        try engine.start()
    }

    /// Change the tone's pitch (Hz) and level (dBFS, capped at −20).
    func setMatch(hz: Double, levelDB: Double) {
        tone.targetHz = hz
        tone.targetAmplitude = Float(pow(10, min(-20, levelDB) / 20))
    }

    func stopMatching() {
        tone.targetAmplitude = 0
        // Let the tone fade (~50 ms) before stopping the engine
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(120))
            guard !self.isRunning else { return }
            self.engine.stop()
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    private func attachToneIfNeeded() {
        if let toneNode, toneNode.outputFormat(forBus: 0).sampleRate == Double(rate) { return }
        if let toneNode { engine.detach(toneNode) }
        let format = AVAudioFormat(standardFormatWithSampleRate: Double(rate), channels: 1)!
        let t = tone
        let sr = Double(rate)
        let k = Float(exp(-1 / (0.05 * sr)))   // ~50 ms smoothing, no clicks
        let node = AVAudioSourceNode(format: format) { _, _, frameCount, bufferList in
            let buffers = UnsafeMutableAudioBufferListPointer(bufferList)
            for frame in 0..<Int(frameCount) {
                t.hz = t.hz * Double(k) + t.targetHz * Double(1 - k)
                t.amplitude = t.amplitude * k + t.targetAmplitude * (1 - k)
                t.phase += 2 * Double.pi * t.hz / sr
                if t.phase > 2 * Double.pi { t.phase -= 2 * Double.pi }
                let v = Float(sin(t.phase)) * t.amplitude
                for b in buffers { b.mData!.assumingMemoryBound(to: Float.self)[frame] = v }
            }
            return noErr
        }
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: format)
        toneNode = node
    }

    // MARK: Engine

    private func attachSourceIfNeeded() {
        let format = AVAudioFormat(standardFormatWithSampleRate: Double(rate), channels: 1)!
        if let source, source.outputFormat(forBus: 0).sampleRate == Double(rate) { return }
        if let source { engine.detach(source) }
        let s = state
        s.smoothing = exp(-1 / (0.05 * Float(rate)))   // ~50 ms
        let node = AVAudioSourceNode(format: format) { _, _, frameCount, bufferList in
            let buffers = UnsafeMutableAudioBufferListPointer(bufferList)
            let count = s.samples.count
            for frame in 0..<Int(frameCount) {
                var value: Float = 0
                if count > 0 {
                    let fp = s.framesPlayed
                    let fade: Float = fp < s.fadeStart ? 1
                        : fp >= s.fadeEnd ? 0
                        : 1 - Float(fp - s.fadeStart) / Float(s.fadeEnd - s.fadeStart)
                    s.gain = s.gain * s.smoothing + s.volume * fade * (1 - s.smoothing)
                    value = s.samples[s.position] * s.gain
                    s.position += 1
                    if s.position == count { s.position = 0 }
                    s.framesPlayed += 1
                }
                for b in buffers { b.mData!.assumingMemoryBound(to: Float.self)[frame] = value }
            }
            return noErr
        }
        engine.attach(node)
        engine.connect(node, to: eq, format: format)
        source = node
    }

    // MARK: Interruptions and headphones

    private func observeSession() {
        let nc = NotificationCenter.default
        // A call or another app taking the sound counts as stopped, as on the website
        nc.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  AVAudioSession.InterruptionType(rawValue: raw) == .began else { return }
            MainActor.assumeIsolated { self?.stopBySelf() }
        }
        // Headphones unplugged: stop rather than play out loud (Apple's guidance)
        nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  AVAudioSession.RouteChangeReason(rawValue: raw) == .oldDeviceUnavailable else { return }
            MainActor.assumeIsolated { self?.stopBySelf() }
        }
    }

    private func stopBySelf() {
        guard isRunning else { return }
        stop()
        onStopped?()
    }

    // MARK: Lock screen

    private func setUpRemoteCommands() {
        let rc = MPRemoteCommandCenter.shared()
        rc.pauseCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated { self?.stopBySelf() }; return .success
        }
        rc.stopCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated { self?.stopBySelf() }; return .success
        }
        rc.playCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated { self?.onRemotePlay?() }; return .success
        }
        rc.togglePlayPauseCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                if self.isRunning { self.stopBySelf() } else { self.onRemotePlay?() }
            }
            return .success
        }
    }

    private func setNowPlaying(title: String) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: "Blanketing Silence",
            MPNowPlayingInfoPropertyIsLiveStream: true,
            MPNowPlayingInfoPropertyPlaybackRate: 1.0,
        ]
        MPNowPlayingInfoCenter.default().playbackState = .playing
    }

    private func clearNowPlaying() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        MPNowPlayingInfoCenter.default().playbackState = .stopped
    }
}
