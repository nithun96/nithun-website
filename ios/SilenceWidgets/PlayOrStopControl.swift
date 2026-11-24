// A button for Control Centre, the lock screen and the Action button (iOS 18 and
// later). It plays your last sound, or stops it if one is playing.
//
// It is a button rather than an on/off switch: a switch has to know whether the
// sound is playing, and the extension can't see that without an App Group
// (shared storage), which needs Nithun's Apple Developer account.

import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct PlayOrStopControl: ControlWidget {
    static let kind = "no.nithun.silence.play-or-stop"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: PlayOrStopIntent()) {
                Label("Silence", systemImage: "moon.zzz.fill")
            }
        }
        .displayName("Play or stop Silence")
        .description("Plays your last sound, or stops it if one is playing.")
    }
}
