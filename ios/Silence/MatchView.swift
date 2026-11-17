import SwiftUI

/// Find the pitch of your tinnitus with a soft sine tone.
/// Safety: the tone always starts at −50 dBFS and can't go above −20 dBFS.
struct MatchView: View {
    @Bindable var model: SilenceModel
    @Environment(\.dismiss) private var dismiss

    // The slider moves along a log scale: 250 Hz … 12 kHz
    private static let lowHz = 250.0, highHz = 12000.0
    private var position: Binding<Double> {
        Binding(
            get: { log(model.matchHz / Self.lowHz) / log(Self.highHz / Self.lowHz) },
            set: { model.matchHz = Self.lowHz * pow(Self.highHz / Self.lowHz, $0) }
        )
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Turn your phone's volume down first. The tone starts very quietly; raise it until you can just hear it, then move the pitch until it sounds most like your tinnitus.")
                    Text("Stop if the tone is uncomfortable. Many people's tinnitus isn't a single tone, so close is good enough.")
                        .foregroundStyle(.secondary)
                }

                Section {
                    if model.matching {
                        Button("Stop the tone") { model.endMatching() }
                    } else {
                        Button("Play the tone") { model.beginMatching() }
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
                            // One semitone down or up, for fine tuning
                            Button { model.matchHz = max(Self.lowHz, model.matchHz / pow(2, 1.0 / 12)) } label: {
                                Image(systemName: "minus")
                            }
                            .accessibilityLabel(Text("Lower"))
                            Spacer()
                            Button { model.matchHz = min(Self.highHz, model.matchHz * pow(2, 1.0 / 12)) } label: {
                                Image(systemName: "plus")
                            }
                            .accessibilityLabel(Text("Higher"))
                        }
                        .buttonStyle(.bordered)
                    }
                    VStack(alignment: .leading) {
                        Text("Tone volume")
                        Slider(value: $model.matchLevelDB, in: -60 ... -20) { Text("Tone volume") }
                            .tint(Color.sage)
                    }
                }
                .disabled(!model.matching)

                Section {
                    Button("Use this pitch") {
                        model.useMatchedPitch()
                        dismiss()
                    }
                    .disabled(!model.matching)
                } footer: {
                    Text("Your pitch is kept on this phone only.")
                }
            }
            .navigationTitle("Match my tinnitus")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
