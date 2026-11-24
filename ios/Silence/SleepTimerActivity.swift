// The sleep timer on the lock screen and in the Dynamic Island (ActivityKit).
// App target only; the extension draws it (SilenceWidgets/SleepTimerLiveActivity.swift).
//
// Shown while a sound plays with a timer. The countdown runs by itself on the
// lock screen (no updates are sent each second); the app only updates it when
// the sound or the timer changes, and ends it when the sound stops.

import ActivityKit
import Foundation

@MainActor
final class SleepTimerActivity {
    private var activity: Activity<SleepTimerAttributes>?

    init() {
        // Left over from a previous run (the app was closed while playing)
        for old in Activity<SleepTimerAttributes>.activities {
            Task { await old.end(nil, dismissalPolicy: .immediate) }
        }
    }

    /// When the sound stops, from the seconds the player says are left.
    nonisolated static func endDate(now: Date, secondsRemaining: Double) -> Date {
        now.addingTimeInterval(max(0, secondsRemaining))
    }

    /// Show or update the countdown.
    func show(soundName: String, endDate: Date) {
        let content = ActivityContent(
            state: SleepTimerAttributes.ContentState(soundName: soundName, endDate: endDate),
            staleDate: endDate
        )
        if let activity, activity.activityState == .active {
            Task { await activity.update(content) }
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        // Fails if iOS won't allow it right now (e.g. started in the background);
        // the timer still works, there is just nothing on the lock screen.
        activity = try? Activity.request(attributes: SleepTimerAttributes(), content: content, pushType: nil)
    }

    func end() {
        guard let activity else { return }
        self.activity = nil
        Task { await activity.end(nil, dismissalPolicy: .immediate) }
    }
}
