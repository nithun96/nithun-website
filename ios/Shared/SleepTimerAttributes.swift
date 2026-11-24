// Compiled into both the app and the widget extension (see project.yml).
//
// What the sleep timer's Live Activity shows. The app starts, updates and ends
// it (Silence/SleepTimerActivity.swift); the extension draws it
// (SilenceWidgets/SleepTimerLiveActivity.swift).

import ActivityKit
import Foundation

struct SleepTimerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        /// The sound's name, already in the app's language
        var soundName: String
        /// When the sound stops (the end of the timer's fade)
        var endDate: Date
    }
}

extension SleepTimerAttributes.ContentState {
    /// The range for a countdown `Text(timerInterval:)`. Never backwards, even
    /// when the end has passed (a backwards range would crash).
    func countdown(now: Date = .now) -> ClosedRange<Date> {
        min(now, endDate)...endDate
    }
}
