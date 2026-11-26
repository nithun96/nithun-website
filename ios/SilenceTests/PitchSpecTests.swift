import XCTest
@testable import Silence

/// The app reads its "Find your pitch" limits from shared/silence-pitch-spec.json,
/// the same file as the website (whose side is checked by scripts/test-pitch-spec.mjs).
final class PitchSpecTests: XCTestCase {
    let spec = PitchSpec.shared

    func testSpecIsBundledAndDecodes() throws {
        let loaded = try XCTUnwrap(PitchSpec.load(from: .main), "silence-pitch-spec.json isn't in the app")
        XCTAssertEqual(loaded, spec)
        XCTAssertLessThan(spec.minHz, spec.startHz)
        XCTAssertLessThan(spec.startHz, spec.maxHz)
        XCTAssertLessThanOrEqual(spec.levelMinDb, spec.levelStartDb)
        XCTAssertLessThanOrEqual(spec.levelStartDb, spec.levelMaxDb)
        XCTAssertLessThanOrEqual(spec.levelMaxDb, -20, "the cap must stay at or below −20 dBFS")
        XCTAssertEqual(spec.ladderHz.first, spec.minHz)
        XCTAssertEqual(spec.ladderHz.last, spec.maxHz)
        XCTAssertFalse(spec.refineStepsSemitones.isEmpty)
    }

    func testLevelNeverPassesTheCap() {
        XCTAssertEqual(spec.clampLevel(0), spec.levelMaxDb)
        XCTAssertEqual(spec.clampLevel(-200), spec.levelMinDb)
        XCTAssertEqual(spec.amplitude(levelDB: 0), spec.amplitude(levelDB: spec.levelMaxDb))
        XCTAssertEqual(Double(spec.amplitude(levelDB: 10)), pow(10, spec.levelMaxDb / 20), accuracy: 1e-6)
    }

    func testPitchStaysInRange() {
        XCTAssertEqual(spec.clampHz(10), spec.minHz)
        XCTAssertEqual(spec.clampHz(50_000), spec.maxHz)
        XCTAssertEqual(spec.hz(position: 0), spec.minHz, accuracy: 1e-9)
        XCTAssertEqual(spec.hz(position: 1), spec.maxHz, accuracy: 1e-6)
        XCTAssertEqual(spec.hz(position: 2), spec.hz(position: 1))
        XCTAssertEqual(spec.position(hz: spec.hz(position: 0.37)), 0.37, accuracy: 1e-12)
    }

    @MainActor
    func testModelUsesTheSpec() {
        let model = SilenceModel.shared
        model.matchLevelDB = 0
        XCTAssertEqual(model.matchLevelDB, spec.levelMaxDb, "the level slider can't go past the cap")
        model.matchLevelDB = -100
        XCTAssertEqual(model.matchLevelDB, spec.levelMinDb)
        model.matchHz = 100_000
        XCTAssertEqual(model.matchHz, spec.maxHz)
        model.matchHz = 1
        XCTAssertEqual(model.matchHz, spec.minHz)
        model.matchLevelDB = spec.levelStartDb
        model.matchHz = spec.startHz
    }

    func testHissIsOneThirdOctave() {
        XCTAssertEqual(spec.hissQ, 4.32, accuracy: 0.01)
    }

    /// The hiss must be as loud (same RMS) as the tone at the same level, so
    /// switching between them doesn't jump in loudness.
    func testHissIsAsLoudAsTheTone() {
        let toneRms = 1 / 2.0.squareRoot()          // a sine of peak 1
        for rate in [44_100.0, 48_000.0] {
            for hz in [spec.minHz, 1000, 4000, spec.maxHz] {
                var hiss = Hiss(q: spec.hissQ)
                hiss.setPitch(hz, rate: rate)
                for _ in 0..<Int(rate) { _ = hiss.next() }   // let the filter settle
                var sum = 0.0
                let n = Int(rate) * 5
                for _ in 0..<n { let v = hiss.next(); sum += v * v }
                let diffDb = 20 * log10((sum / Double(n)).squareRoot() / toneRms)
                XCTAssertEqual(diffDb, 0, accuracy: 0.5, "\(hz) Hz at \(rate)")
            }
        }
    }

    func testOctaveCheckOptions() {
        XCTAssertEqual(spec.octaveOptions(for: 2000).map(\.octave), [.lower, .this, .higher])
        XCTAssertEqual(spec.octaveOptions(for: 2000).map(\.hz), [1000, 2000, 4000])
        XCTAssertEqual(spec.octaveOptions(for: 400).map(\.octave), [.this, .higher])
        XCTAssertEqual(spec.octaveOptions(for: 7000).map(\.octave), [.lower, .this])
        for hz in [spec.minHz, 333, 1234, 5000, spec.maxHz] {
            for o in spec.octaveOptions(for: hz) {
                XCTAssertTrue((spec.minHz...spec.maxHz).contains(o.hz))
            }
        }
    }

    func testMatchSoundNames() {
        XCTAssertEqual(MatchSound(rawValue: "tone"), .tone)
        XCTAssertEqual(MatchSound(rawValue: "hiss"), .hiss)
        XCTAssertNil(MatchSound(rawValue: "loud"))
    }
}
