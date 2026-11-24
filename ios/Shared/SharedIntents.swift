// Compiled into both the app and the widget extension (see project.yml).
//
// Buttons in the Live Activity and the Control Centre control run these. Both
// conform to AudioPlaybackIntent, so iOS runs them in the app's own process,
// where the player is, even when the button is in the extension. The extension's
// copy never plays anything, so its perform() is empty (SILENCE_APP is set for
// the app target only).

import AppIntents

/// Stop whatever Silence is playing (Siri, Shortcuts, the Live Activity's Stop).
struct StopSoundIntent: AudioPlaybackIntent {
    static let title: LocalizedStringResource = "Stop the sound"
    static let description = IntentDescription("Stops whatever Silence is playing.")
    static let openAppWhenRun = false

    init() {}

    func perform() async throws -> some IntentResult {
        #if SILENCE_APP
        await MainActor.run { SilenceModel.shared.stopEverything() }
        #endif
        return .result()
    }
}

/// Play your last sound, or stop it if something is playing (Control Centre).
struct PlayOrStopIntent: AudioPlaybackIntent, LiveActivityIntent {
    static let title: LocalizedStringResource = "Play or stop"
    static let description = IntentDescription("Plays your last sound, or stops it if one is playing.")
    static let openAppWhenRun = false

    init() {}

    func perform() async throws -> some IntentResult {
        #if SILENCE_APP
        try await SilenceModel.shared.playOrStop()
        #endif
        return .result()
    }
}
