// The sleep timer on the lock screen and in the Dynamic Island. The app starts
// and ends it (Silence/SleepTimerActivity.swift). Text(timerInterval:) counts
// down by itself, so the app doesn't send an update every second.

import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

struct SleepTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SleepTimerAttributes.self) { context in
            LockScreenView(state: context.state)
                .padding(16)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label {
                        Text(context.state.soundName)
                    } icon: {
                        Image(systemName: "moon.zzz.fill").foregroundStyle(Color.sage)
                    }
                    .font(.headline)
                    .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Countdown(state: context.state)
                        .font(.title3.monospacedDigit())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    StopButton()
                }
            } compactLeading: {
                Image(systemName: "moon.zzz.fill")
                    .foregroundStyle(Color.sage)
                    .accessibilityLabel(Text("Sleep timer"))
            } compactTrailing: {
                Countdown(state: context.state)
                    .font(.caption.monospacedDigit())
                    .frame(maxWidth: 52)
            } minimal: {
                Image(systemName: "moon.zzz.fill")
                    .foregroundStyle(Color.sage)
                    .accessibilityLabel(Text("Sleep timer"))
            }
        }
    }
}

private struct LockScreenView: View {
    let state: SleepTimerAttributes.ContentState

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: "moon.zzz.fill")
                .font(.title2)
                .foregroundStyle(Color.sage)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(state.soundName).font(.headline)
                HStack(spacing: 4) {
                    Text("Stops in")
                    Countdown(state: state)
                }
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
            }
            Spacer()
            StopButton()
        }
    }
}

/// Counts down to the end of the timer, on the device, with no updates needed.
private struct Countdown: View {
    let state: SleepTimerAttributes.ContentState

    var body: some View {
        Text(timerInterval: state.countdown(), countsDown: true)
            .multilineTextAlignment(.trailing)
    }
}

private struct StopButton: View {
    var body: some View {
        Button(intent: StopSoundIntent()) {
            Label("Stop", systemImage: "stop.fill")
        }
        .tint(Color.sage)
    }
}
