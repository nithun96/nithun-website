import SwiftUI

// A working first screen, not the design. Layout, type and colour are Nithun's
// call; this mirrors the website's structure (sounds list, then the player).

// Color.sage is in Shared/Colours.swift (the widgets use it too).

struct ContentView: View {
    /// The one shared model (SilenceModel.shared), also used by Siri and Shortcuts
    @Bindable var model: SilenceModel
    @State private var showingMatch = false
    @Environment(\.openURL) private var openURL

    /// Placeholder until the page exists on nithun.no
    static let privacyURL = URL(string: "https://nithun.no/silence/privacy")!

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                header
                sounds
                playerControls
                yourSound
                footer
            }
            .padding(24)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            (Text("Blanketing ") + Text("Silence").italic().foregroundStyle(Color.sage))
                .font(.system(size: 44, weight: .regular, design: .serif))
                .accessibilityAddTraits(.isHeader)
            Text("A small, free sound tool for tinnitus and sleep. Pick a sound, set a sleep timer, and it keeps playing with the screen locked.")
                .foregroundStyle(.secondary)
        }
    }

    private var sounds: some View {
        VStack(spacing: 0) {
            ForEach(Array(Sound.allCases.enumerated()), id: \.element) { i, sound in
                let on = model.playing == sound
                Button { model.toggle(sound) } label: {
                    HStack(alignment: .firstTextBaseline, spacing: 14) {
                        Text("0\(i + 1)").font(.caption.monospaced()).foregroundStyle(Color.sage)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(sound.nameKey).font(.title3)
                            Text(sound.descriptionKey).font(.subheadline).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if model.preparing == sound {
                            ProgressView()
                        } else {
                            Image(systemName: on ? "pause.fill" : "play.fill").foregroundStyle(Color.sage)
                        }
                    }
                    .padding(.vertical, 14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(on ? .isSelected : [])
                Divider()
            }
        }
    }

    private var playerControls: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 16) {
                let target = model.playing ?? model.last ?? .brown
                Button { model.toggle(target) } label: {
                    Image(systemName: model.playing == nil ? "play.fill" : "pause.fill")
                        .font(.title)
                        .frame(width: 64, height: 64)
                        .background(Circle().fill(Color.sage))
                        .foregroundStyle(Color(.systemBackground))
                }
                .accessibilityLabel(model.playing == nil ? Text("Play") : Text("Pause"))
                VStack(alignment: .leading) {
                    Text("Now playing").font(.caption).foregroundStyle(.secondary)
                    if let p = model.playing { Text(p.nameKey) }
                    else if let l = model.last { Text("\(String(localized: l.nameKey)) (paused)") }
                    else { Text("Nothing yet") }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Sleep timer").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text(timerText).font(.body.monospacedDigit())
                }
                Picker("Sleep timer", selection: $model.timerMinutes) {
                    ForEach(SilenceModel.timerOptions(including: model.timerMinutes), id: \.self) { mins in
                        if let mins { Text("\(mins) min").tag(mins as Int?) } else { Text("Off").tag(nil as Int?) }
                    }
                }
                .pickerStyle(.segmented)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Volume").font(.caption).foregroundStyle(.secondary)
                Slider(value: $model.volume, in: 0...1) { Text("Volume") }
                    .tint(Color.sage)
            }

            if model.audioError {
                Text("Audio couldn't start. Tap the sound again.").foregroundStyle(.red)
            }
        }
    }

    // MARK: Your sound

    private var yourSound: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your sound").font(.title2.weight(.regular)).fontDesign(.serif)
                .accessibilityAddTraits(.isHeader)

            VStack(alignment: .leading, spacing: 8) {
                Text("Tone").font(.caption).foregroundStyle(.secondary)
                Slider(value: $model.tone, in: -1...1) {
                    Text("Tone")
                } minimumValueLabel: { Text("Darker").font(.caption) }
                  maximumValueLabel: { Text("Brighter").font(.caption) }
                .tint(Color.sage)
            }

            if let hz = model.matchedHz {
                Toggle(isOn: $model.focusOn) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Focus on my pitch")
                        Text("Sound centred around \(Self.format(hz))").font(.caption).foregroundStyle(.secondary)
                    }
                }
                .tint(Color.sage)
                HStack {
                    Button("Match again") { showingMatch = true }
                    Spacer()
                    Button("Forget my pitch", role: .destructive) { model.forgetMatch() }
                }
                .font(.subheadline)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Find the pitch of your tinnitus with a soft tone, and Silence can put more of its sound around it.")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Button("Match my tinnitus") { showingMatch = true }
                        .buttonStyle(.bordered).tint(Color.sage)
                }
            }
        }
        .sheet(isPresented: $showingMatch, onDismiss: { model.endMatching() }) {
            MatchView(model: model)
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Silence isn't a medical device. If your tinnitus is new, changes, or is in one ear only, see a doctor.")
            Button("Privacy: Silence collects no data") { openURL(Self.privacyURL) }
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
    }

    static func format(_ hz: Double) -> String {
        hz >= 1000
            ? Measurement(value: hz / 1000, unit: UnitFrequency.kilohertz)
                .formatted(.measurement(width: .abbreviated, numberFormatStyle: .number.precision(.fractionLength(1))))
            : Measurement(value: hz.rounded(), unit: UnitFrequency.hertz)
                .formatted(.measurement(width: .abbreviated, numberFormatStyle: .number.precision(.fractionLength(0))))
    }

    private var timerText: String {
        guard let mins = model.timerMinutes else { return String(localized: "Off") }
        let total = Int((model.remaining ?? Double(mins * 60)).rounded(.up))
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }
}

#Preview { ContentView(model: .shared) }
