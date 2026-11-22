// Siri and Shortcuts (App Intents). App target only.
//
// The intents run in the app's process without opening it (AudioPlaybackIntent),
// and use the same SilenceModel as the screen, so the volume, tone and focus you
// set in the app apply, and the screen shows what Siri started.
//
// Siri phrases can carry one value each, so "Play rain" and "Play Silence for an
// hour" are separate phrases. In the Shortcuts app, "Play a sound" takes both a
// sound and any number of minutes.

import AppIntents

/// The sounds, as Siri and Shortcuts see them. Same cases as `Sound`.
enum SoundOption: String, AppEnum {
    case brown, pink, rain, ocean

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Sound")
    static let caseDisplayRepresentations: [SoundOption: DisplayRepresentation] = [
        .brown: DisplayRepresentation(title: "Brown noise", synonyms: ["Brown"]),
        .pink: DisplayRepresentation(title: "Pink noise", synonyms: ["Pink"]),
        .rain: DisplayRepresentation(title: "Rain", synonyms: ["Rain sounds"]),
        .ocean: DisplayRepresentation(title: "Ocean", synonyms: ["Sea", "Waves"]),
    ]

    var sound: Sound? { Sound(rawValue: rawValue) }
}

/// Sleep timer lengths Siri understands ("for an hour", "for half an hour").
enum TimerLength: String, AppEnum {
    case m15, m30, m45, m60, m90, m120, m180, m480

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Sleep timer")
    static let caseDisplayRepresentations: [TimerLength: DisplayRepresentation] = [
        .m15: DisplayRepresentation(title: "15 minutes", synonyms: ["a quarter of an hour"]),
        .m30: DisplayRepresentation(title: "30 minutes", synonyms: ["half an hour"]),
        .m45: DisplayRepresentation(title: "45 minutes", synonyms: ["three quarters of an hour"]),
        .m60: DisplayRepresentation(title: "1 hour", synonyms: ["an hour", "one hour", "60 minutes"]),
        .m90: DisplayRepresentation(title: "90 minutes", synonyms: ["an hour and a half"]),
        .m120: DisplayRepresentation(title: "2 hours", synonyms: ["two hours"]),
        .m180: DisplayRepresentation(title: "3 hours", synonyms: ["three hours"]),
        .m480: DisplayRepresentation(title: "8 hours", synonyms: ["eight hours", "all night"]),
    ]

    var minutes: Int { Int(rawValue.dropFirst())! }
}

enum IntentLimits {
    static let minutes = 1...720

    /// Keep a requested timer between 1 minute and 12 hours.
    static func clamp(minutes m: Int) -> Int {
        min(max(m, minutes.lowerBound), minutes.upperBound)
    }
}

struct SilenceIntentError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "Silence couldn't start the sound. Open the app and try again."
    }
}

/// "Play rain in Silence"; in Shortcuts, any sound for any number of minutes.
struct PlaySoundIntent: AudioPlaybackIntent, LiveActivityIntent {
    static let title: LocalizedStringResource = "Play a sound"
    static let description = IntentDescription("Plays one of Silence's sounds with your volume and tone from the app.")
    static let openAppWhenRun = false

    @Parameter(title: "Sound")
    var sound: SoundOption

    @Parameter(title: "Minutes",
               description: "Stops the sound after this many minutes (1 to 720). Leave it empty to use the sleep timer set in the app.")
    var minutes: Int?

    init() {}

    init(sound: SoundOption, minutes: Int? = nil) {
        self.sound = sound
        self.minutes = minutes
    }

    static var parameterSummary: some ParameterSummary {
        Summary("Play \(\.$sound)") {
            \.$minutes
        }
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        let model = SilenceModel.shared
        if let minutes { model.timerMinutes = IntentLimits.clamp(minutes: minutes) }
        guard let s = sound.sound, await model.play(s) else { throw SilenceIntentError() }
        return .result()
    }
}

/// "Play Silence for an hour": your last sound, with that sleep timer.
struct PlayWithTimerIntent: AudioPlaybackIntent, LiveActivityIntent {
    static let title: LocalizedStringResource = "Play with a sleep timer"
    static let description = IntentDescription("Plays your last sound and stops it after the time you choose.")
    static let openAppWhenRun = false

    @Parameter(title: "Sleep timer")
    var length: TimerLength

    init() {}

    static var parameterSummary: some ParameterSummary {
        Summary("Play for \(\.$length)")
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        let model = SilenceModel.shared
        model.timerMinutes = length.minutes
        guard await model.play(model.last ?? .brown) else { throw SilenceIntentError() }
        return .result()
    }
}

struct SilenceShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: PlaySoundIntent(),
            phrases: [
                "Play \(\.$sound) in \(.applicationName)",
                "Play \(\.$sound) with \(.applicationName)",
                "Start \(\.$sound) in \(.applicationName)",
                "Play \(.applicationName)",
            ],
            shortTitle: "Play a sound",
            systemImageName: "play.fill"
        )
        AppShortcut(
            intent: PlayWithTimerIntent(),
            phrases: [
                "Play \(.applicationName) for \(\.$length)",
                "Start \(.applicationName) for \(\.$length)",
            ],
            shortTitle: "Play with a sleep timer",
            systemImageName: "moon.zzz.fill"
        )
        AppShortcut(
            intent: StopSoundIntent(),
            phrases: [
                "Stop \(.applicationName)",
                "Turn off \(.applicationName)",
                "Stop the sound in \(.applicationName)",
            ],
            shortTitle: "Stop the sound",
            systemImageName: "stop.fill"
        )
    }
}
