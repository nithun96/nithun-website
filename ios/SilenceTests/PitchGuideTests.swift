import XCTest
@testable import Silence

/// The guide's answers → pitch, checked against the examples in
/// shared/silence-pitch-spec.json. The website runs the same examples
/// (scripts/test-pitch-spec.mjs), so the same answers give the same pitch in both.
final class PitchGuideTests: XCTestCase {
    let spec = PitchSpec.shared

    struct Example: Decodable {
        let matchSound: String
        let ladderChoiceHz: Double
        let refineAnswers: [PitchSpec.RefineAnswer]
        let octaveAnswer: PitchSpec.OctaveAnswer
        let expectedHz: Double
    }

    struct ExamplesFile: Decodable { let examples: [Example] }

    func examples() throws -> [Example] {
        let url = try XCTUnwrap(Bundle.main.url(forResource: "silence-pitch-spec", withExtension: "json"))
        return try JSONDecoder().decode(ExamplesFile.self, from: Data(contentsOf: url)).examples
    }

    func testEveryExampleGivesItsPitch() throws {
        let examples = try examples()
        XCTAssertGreaterThanOrEqual(examples.count, 6)
        for e in examples {
            XCTAssertTrue(spec.ladderHz.contains(e.ladderChoiceHz), "\(e.ladderChoiceHz) isn't on the ladder")
            XCTAssertEqual(e.refineAnswers.count, spec.refineStepsSemitones.count)
            XCTAssertNotNil(MatchSound(rawValue: e.matchSound))
            let hz = spec.pitch(ladderChoiceHz: e.ladderChoiceHz, refineAnswers: e.refineAnswers, octaveAnswer: e.octaveAnswer)
            XCTAssertEqual(hz, e.expectedHz, accuracy: 0.5, "\(e)")
            XCTAssertTrue((spec.minHz...spec.maxHz).contains(hz))
        }
        XCTAssertTrue(examples.contains { $0.expectedHz == spec.minHz }, "an example should stop at minHz")
        XCTAssertTrue(examples.contains { $0.expectedHz == spec.maxHz }, "an example should stop at maxHz")
    }

    func testRefineRule() throws {
        let o = spec.refineOptions(for: 1000, step: 6)
        XCTAssertEqual(try XCTUnwrap(o.down), 1000 / 2.0.squareRoot(), accuracy: 1e-9)
        XCTAssertEqual(try XCTUnwrap(o.up), 1000 * 2.0.squareRoot(), accuracy: 1e-9)
        XCTAssertNil(spec.refineOptions(for: spec.minHz, step: 6).down, "already at the edge: hidden")
        XCTAssertNil(spec.refineOptions(for: spec.maxHz, step: 1).up)
        XCTAssertEqual(spec.refineOptions(for: 300, step: 6).down, spec.minHz, "clamped, still offered")
        XCTAssertEqual(spec.refined(1000, step: 3, answer: .unsure), 1000)
        XCTAssertEqual(spec.refined(spec.minHz, step: 6, answer: .down), spec.minHz)
        XCTAssertEqual(spec.octaveChecked(7000, answer: .higher), 7000, "14 kHz is hidden")
        XCTAssertEqual(spec.octaveChecked(2000, answer: .lower), 1000)
        XCTAssertEqual(spec.octaveChecked(2000, answer: .same), 2000)
    }

    func testWhistleOrHiss() {
        XCTAssertEqual(PitchSpec.matchSound(for: .whistle), .tone)
        XCTAssertEqual(PitchSpec.matchSound(for: .hiss), .hiss)
        XCTAssertEqual(PitchSpec.matchSound(for: .unsure), .hiss)
    }

    func testGuideSettings() {
        XCTAssertGreaterThan(spec.guidePlaySeconds, 0)
        XCTAssertLessThanOrEqual(spec.guidePlaySeconds, 10)
        XCTAssertTrue(spec.refineStepsSemitones.allSatisfy { $0 > 0 })
    }
}
