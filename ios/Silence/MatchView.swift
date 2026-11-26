import SwiftUI

/// Find the pitch of your tinnitus with a soft tone or hiss.
/// Safety: the sound always starts at −50 dBFS and can't go above −20 dBFS (both
/// from shared/silence-pitch-spec.json, via PitchSpec).
///
/// Two steps: find the pitch, then (after "Use this pitch") an octave check,
/// because it's easy to pick the right note in the wrong octave.
struct MatchView: View {
    @Bindable var model: SilenceModel
    @Environment(\.dismiss) private var dismiss
    /// The pitch from step 1, during the octave check
    @State private var chosenHz: Double?
    @AccessibilityFocusState private var octaveTitleFocused: Bool

    private let spec = PitchSpec.shared

    // The slider moves along a log scale: minHz … maxHz
    private var position: Binding<Double> {
        Binding(
            get: { spec.position(hz: model.matchHz) },
            set: { model.matchHz = spec.hz(position: $0) }
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if let chosenHz {
                    octaveCheck(chosenHz)
                } else {
                    findPitch
                }
            }
            .navigationTitle("Match my tinnitus")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { model.endMatching(); dismiss() }
                }
            }
        }
    }

    // MARK: Step 1: find the pitch

    private var findPitch: some View {
        Form {
            Section {
                Text("Turn your phone's volume down first. The sound starts very quietly; raise it until you can just hear it, then move the pitch until it sounds most like your tinnitus.")
                Text("Stop if the sound is uncomfortable. Many people's tinnitus isn't a single tone, so close is good enough.")
                    .foregroundStyle(.secondary)
            }

            Section {
                Picker("Sound to compare", selection: $model.matchSound) {
                    Text("matchSound.tone").tag(MatchSound.tone)   // "Tone" is taken by the tone slider ("Klang")
                    Text("matchSound.hiss").tag(MatchSound.hiss)
                }
                .pickerStyle(.segmented)
            } header: {
                Text("Sound to compare")
            } footer: {
                Text("Tone is a single clear note. Hiss is a soft rush of sound around the pitch; many people find it closer to their tinnitus.")
            }

            Section {
                // Separate literals (not a ?: of strings) so each is looked up for translation
                if model.matching {
                    Button { model.endMatching() } label: {
                        if model.matchSound == .hiss { Text("Stop the hiss") } else { Text("Stop the tone") }
                    }
                } else {
                    Button { model.beginMatching() } label: {
                        if model.matchSound == .hiss { Text("Play the hiss") } else { Text("Play the tone") }
                    }
                }
            }

            Section {
                VStack(alignment: .leading) {
                    HStack {
                        Text("Pitch")
                        Spacer()
                        Text(ContentView.format(model.matchHz)).monospacedDigit()
                    }
                    Slider(value: position, in: 0...1) { Text("Pitch") }
                        .tint(Color.sage)
                        .accessibilityValue(ContentView.format(model.matchHz))
                    HStack {
                        // One semitone down or up, for fine tuning (kept in range by the model)
                        Button { model.matchHz /= pow(2, 1.0 / 12) } label: {
                            Image(systemName: "minus")
                        }
                        .accessibilityLabel(Text("Lower"))
                        Spacer()
                        Button { model.matchHz *= pow(2, 1.0 / 12) } label: {
                            Image(systemName: "plus")
                        }
                        .accessibilityLabel(Text("Higher"))
                    }
                    .buttonStyle(.bordered)
                }
                VStack(alignment: .leading) {
                    Text("Volume")
                    Slider(value: $model.matchLevelDB, in: spec.levelMinDb ... spec.levelMaxDb) { Text("Volume") }
                        .tint(Color.sage)
                        .accessibilityValue(Text("\(Int(model.matchLevelDB.rounded())) dB"))
                }
            }
            .disabled(!model.matching)

            Section {
                Button("Use this pitch") {
                    if spec.octaveCheck {
                        chosenHz = model.matchHz
                        octaveTitleFocused = true
                    } else {
                        model.useMatchedPitch()
                        dismiss()
                    }
                }
                .disabled(!model.matching)
            } footer: {
                Text("Your pitch is kept on this phone only.")
            }
        }
    }

    // MARK: Step 2: octave check

    private func octaveCheck(_ chosen: Double) -> some View {
        Form {
            Section {
                Text("One more check: which is most like it?")
                    .font(.headline)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityFocused($octaveTitleFocused)
                Text("It's easy to land on the right note in the wrong octave. Play each one and choose the closest.")
                    .foregroundStyle(.secondary)
            }

            Section {
                ForEach(spec.octaveOptions(for: chosen)) { option in
                    octaveRow(option.octave, hz: option.hz)
                }
            }

            Section {
                Button("Skip") {
                    model.useMatchedPitch(chosen)
                    dismiss()
                }
            } footer: {
                Text("Your pitch is kept on this phone only.")
            }
        }
        .onAppear { octaveTitleFocused = true }
    }

    private func octaveRow(_ octave: PitchSpec.Octave, hz: Double) -> some View {
        let name = Self.name(octave)
        let pitch = ContentView.format(hz)
        let on = model.matching && model.matchHz == hz
        return HStack(spacing: 14) {
            Button {
                if on { model.endMatching() } else { model.playMatch(at: hz) }
            } label: {
                Group {
                    if on { Label("Stop", systemImage: "stop.fill") } else { Label("Play", systemImage: "play.fill") }
                }
                .frame(minWidth: 72, alignment: .leading)
            }
            .buttonStyle(.bordered)
            .tint(Color.sage)
            .accessibilityLabel(on ? Text("Stop \(String(localized: name)), \(pitch)") : Text("Play \(String(localized: name)), \(pitch)"))

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                Text(pitch).font(.caption).foregroundStyle(.secondary).monospacedDigit()
            }
            .accessibilityHidden(true)

            Spacer()

            Button("Choose") {
                model.useMatchedPitch(hz)
                dismiss()
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.sage)
            .accessibilityLabel(Text("Choose \(String(localized: name)), \(pitch)"))
        }
    }

    static func name(_ octave: PitchSpec.Octave) -> LocalizedStringResource {
        switch octave {
        case .lower: "Lower"
        case .this: "This one"
        case .higher: "Higher"
        }
    }
}
