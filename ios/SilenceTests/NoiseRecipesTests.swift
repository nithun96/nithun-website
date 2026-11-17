import XCTest
@testable import Silence

/// The app must sound exactly like the website. tools/golden.json holds reference
/// samples made from the website's src/audio/noiseRecipes.js (tools/golden.mjs).
/// The "Silence sounds" GitHub check regenerates that file from the website's code
/// and fails if it changed, so a sound change on the site can't slip past the app.
final class NoiseRecipesTests: XCTestCase {
    struct Golden: Decodable {
        let rate: Int
        let idx: [Int]
        let samples: [String: [Float]]
    }

    func golden() throws -> Golden {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "golden", withExtension: "json"))
        return try JSONDecoder().decode(Golden.self, from: Data(contentsOf: url))
    }

    func testMatchesWebsite() throws {
        let g = try golden()
        XCTAssertEqual(Set(g.samples.keys), Set(Sound.allCases.map(\.rawValue)), "the app and the site have different sounds")
        for sound in Sound.allCases {
            let loop = NoiseRecipes.makeLoop(sound, rate: g.rate)
            XCTAssertEqual(loop.count, NoiseRecipes.loopSecs * g.rate)
            let expected = try XCTUnwrap(g.samples[sound.rawValue])
            for (k, i) in g.idx.enumerated() {
                XCTAssertEqual(loop[i], expected[k], accuracy: 1e-5, "\(sound) sample \(i)")
            }
        }
    }

    func testLoopHasNoClick() {
        // The end must run into the start: the jump across the seam is no bigger
        // than the biggest jump anywhere else in the loop
        for sound in Sound.allCases {
            let loop = NoiseRecipes.makeLoop(sound, rate: 48000)
            var biggest: Float = 0
            for i in 1..<loop.count { biggest = max(biggest, abs(loop[i] - loop[i - 1])) }
            XCTAssertLessThanOrEqual(abs(loop[0] - loop[loop.count - 1]), biggest, "\(sound)")
        }
    }
}
