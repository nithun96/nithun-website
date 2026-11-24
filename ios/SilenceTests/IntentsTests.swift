import XCTest
@testable import Silence

/// Siri, Shortcuts and the lock-screen timer. These run without a device; whether
/// Siri understands the phrases can only be checked on a real iPhone.
final class IntentsTests: XCTestCase {
    func testEverySoundCanBeAskedFor() {
        // Siri's list of sounds and the player's must be the same four
        XCTAssertEqual(Set(SoundOption.allCases.compactMap(\.sound)), Set(Sound.allCases))
        XCTAssertEqual(SoundOption.allCases.count, Sound.allCases.count)
        for sound in Sound.allCases {
            XCTAssertNotNil(SoundOption(rawValue: sound.rawValue), "\(sound) missing from Siri")
            XCTAssertNotNil(SoundOption.caseDisplayRepresentations[SoundOption(rawValue: sound.rawValue)!])
        }
    }

    func testMinutesAreKeptInRange() {
        XCTAssertEqual(IntentLimits.clamp(minutes: 0), 1)
        XCTAssertEqual(IntentLimits.clamp(minutes: -5), 1)
        XCTAssertEqual(IntentLimits.clamp(minutes: 1), 1)
        XCTAssertEqual(IntentLimits.clamp(minutes: 60), 60)
        XCTAssertEqual(IntentLimits.clamp(minutes: 720), 720)
        XCTAssertEqual(IntentLimits.clamp(minutes: 10_000), 720)
    }

    func testTimerLengths() {
        XCTAssertEqual(TimerLength.allCases.map(\.minutes), [15, 30, 45, 60, 90, 120, 180, 480])
        for length in TimerLength.allCases {
            XCTAssertTrue(IntentLimits.minutes.contains(length.minutes))
            XCTAssertNotNil(TimerLength.caseDisplayRepresentations[length])
        }
    }

    @MainActor
    func testPickerShowsATimerSetBySiri() {
        XCTAssertEqual(SilenceModel.timerOptions(including: nil), SilenceModel.timerOptions)
        XCTAssertEqual(SilenceModel.timerOptions(including: 60), SilenceModel.timerOptions)
        XCTAssertEqual(SilenceModel.timerOptions(including: 45), [nil, 30, 45, 60, 90])
        XCTAssertEqual(SilenceModel.timerOptions(including: 480), [nil, 30, 60, 90, 480])
    }

    func testLiveActivityEndDate() {
        let now = Date(timeIntervalSinceReferenceDate: 1_000_000)
        XCTAssertEqual(SleepTimerActivity.endDate(now: now, secondsRemaining: 3600), now.addingTimeInterval(3600))
        XCTAssertEqual(SleepTimerActivity.endDate(now: now, secondsRemaining: -3), now)
    }

    func testCountdownNeverRunsBackwards() {
        let end = Date(timeIntervalSinceReferenceDate: 1_000_000)
        let state = SleepTimerAttributes.ContentState(soundName: "Rain", endDate: end)
        XCTAssertEqual(state.countdown(now: end.addingTimeInterval(-90)), end.addingTimeInterval(-90)...end)
        // After the end (e.g. a late redraw) the range is empty, not backwards
        XCTAssertEqual(state.countdown(now: end.addingTimeInterval(30)), end...end)
    }
}
