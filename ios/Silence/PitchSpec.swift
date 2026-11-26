import Foundation

/// The "Find your pitch" settings, read from shared/silence-pitch-spec.json: the
/// same file the website reads (src/audio/yourSound.js), so the app and the site
/// can't drift apart. It is bundled with the app (see project.yml) and decoded
/// once, at startup.
struct PitchSpec: Decodable, Equatable, Sendable {
    let minHz: Double
    let maxHz: Double
    let startHz: Double
    let levelStartDb: Double
    let levelMinDb: Double
    let levelMaxDb: Double
    let ladderHz: [Double]               // for the step-by-step guide (part 2)
    let refineStepsSemitones: [Double]   // ditto
    let octaveCheck: Bool
    let hissBandwidthOctaves: Double

    static let shared: PitchSpec = {
        guard let spec = load(from: .main) else {
            preconditionFailure("silence-pitch-spec.json is missing from the app or can't be read")
        }
        return spec
    }()

    static func load(from bundle: Bundle) -> PitchSpec? {
        guard let url = bundle.url(forResource: "silence-pitch-spec", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(PitchSpec.self, from: data)
    }

    // MARK: Limits

    func clampHz(_ hz: Double) -> Double { min(maxHz, max(minHz, hz)) }

    /// The level is kept between levelMinDb and levelMaxDb (the cap).
    func clampLevel(_ db: Double) -> Double { min(levelMaxDb, max(levelMinDb, db)) }

    /// Peak amplitude of the tone at a level (dBFS), never above the cap.
    func amplitude(levelDB: Double) -> Float { Float(pow(10, clampLevel(levelDB) / 20)) }

    /// The pitch slider runs along a log scale: 0 → minHz, 1 → maxHz.
    func hz(position p: Double) -> Double { minHz * pow(maxHz / minHz, min(1, max(0, p))) }
    func position(hz: Double) -> Double { log(clampHz(hz) / minHz) / log(maxHz / minHz) }

    /// Q for a band-pass `hissBandwidthOctaves` wide: √(2^N) / (2^N − 1). ⅓ octave → ≈ 4.32.
    var hissQ: Double {
        let r = pow(2, hissBandwidthOctaves)
        return r.squareRoot() / (r - 1)
    }

    // MARK: Octave check

    enum Octave: String, CaseIterable { case lower, this, higher }

    struct OctaveOption: Hashable, Identifiable {
        let octave: Octave
        let hz: Double
        var id: Octave { octave }
    }

    /// The pitch, an octave lower and an octave higher; any outside the range is left out.
    func octaveOptions(for hz: Double) -> [OctaveOption] {
        [OctaveOption(octave: .lower, hz: hz / 2), OctaveOption(octave: .this, hz: hz), OctaveOption(octave: .higher, hz: hz * 2)]
            .filter { $0.octave == .this || ($0.hz >= minHz && $0.hz <= maxHz) }
    }
}

/// The two sounds you can compare with your tinnitus.
enum MatchSound: String, CaseIterable, Identifiable {
    case tone, hiss
    var id: String { rawValue }
}

/// The hiss: white noise through a band-pass filter centred on the pitch, one-third
/// of an octave wide. The same filter as the website's (Web Audio's "bandpass"
/// BiquadFilterNode, constant 0 dB peak), run sample by sample on the audio thread.
///
/// Loudness: `next()` returns noise scaled so its RMS is 1/√2, the RMS of a sine of
/// peak 1. So hiss × amplitude is as loud as the tone × amplitude at the same level.
/// White noise spread evenly over −1…1 has RMS 1/√3, and this filter keeps exactly
/// α / (1 + α) of its power, where α = sin(2π·f/rate) / (2Q); the gain makes up the
/// rest. A band a third of an octave wide holds more Hz higher up, so the gain
/// follows the pitch.
struct Hiss {
    private var seed: UInt32 = 0x9E37_79B9
    private var x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0
    private var b0 = 0.0, a1 = 0.0, a2 = 0.0     // b1 = 0, b2 = −b0
    private var gain = 0.0
    let q: Double

    init(q: Double) { self.q = q }

    /// Centre the band on `hz`. Cheap enough to call every few dozen samples while the pitch glides.
    mutating func setPitch(_ hz: Double, rate: Double) {
        let w = 2 * Double.pi * hz / rate
        let alpha = sin(w) / (2 * q)
        let a0 = 1 + alpha
        b0 = alpha / a0
        a1 = -2 * cos(w) / a0
        a2 = (1 - alpha) / a0
        gain = (1 / 2.0.squareRoot()) / ((1 / 3.0.squareRoot()) * (alpha / (1 + alpha)).squareRoot())
    }

    mutating func next() -> Double {
        // xorshift32: fast, allocation-free white noise for the render thread
        seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5
        let x = Double(seed) / Double(UInt32.max) * 2 - 1
        let y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2
        x2 = x1; x1 = x; y2 = y1; y1 = y
        return y * gain
    }
}
