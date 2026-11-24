// The widget extension: the sleep timer's Live Activity, and (iOS 18 and later)
// the Control Centre / lock-screen button. It draws only; the sound always plays
// in the app (see Shared/SharedIntents.swift).

import SwiftUI
import WidgetKit

@main
struct SilenceWidgets: WidgetBundle {
    var body: some Widget {
        SleepTimerLiveActivity()
        if #available(iOS 18.0, *) {
            PlayOrStopControl()
        }
    }
}
