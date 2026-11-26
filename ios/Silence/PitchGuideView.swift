import SwiftUI

/// The step-by-step guide to finding your pitch, shown the first time someone taps
/// Match my tinnitus. The same steps as the website (src/components/PitchGuide.jsx):
///   1 Before you start · 2 Set a comfortable level · 3 Whistle or hiss?
///   4 Get close (the seven ladder sounds) · 5 Narrow it down (four rounds)
///   6 Octave check · 7 Done
/// The pitch arithmetic is in PitchSpec (refined, octaveChecked), tested against
/// the examples in shared/silence-pitch-spec.json, like the website's.
/// Safety: the sound starts at levelStartDb (−50 dBFS) and can't go above
/// levelMaxDb (−20 dBFS). Cancel or swiping the sheet away stops it.
struct PitchGuideView: View {
    @Bindable var model: SilenceModel
    /// Skip to the slider, or Fine-tune: open the slider at this pitch
    let onSlider: (Double) -> Void
    /// After Use this pitch
    let onDone: () -> Void

    enum Step: Int, CaseIterable { case start = 1, level, kind, ladder, refine, octave, done }

    @State private var step: Step = .start
    @State private var rung = 0                                  // Get close: which of the seven
    @State private var round = 0                                 // Narrow it down: which round
    @State private var current = PitchSpec.shared.startHz        // the pitch so far
    @AccessibilityFocusState private var titleFocused: Bool

    private let spec = PitchSpec.shared

    var body: some View {
        Form {
            Section {
                Text("Step \(step.rawValue) of \(Step.allCases.count)")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Color.sage)
                    .accessibilityHidden(true)
                title
                    .font(.title3.weight(.semibold))
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityFocused($titleFocused)
            }
            content
            if step != .done {
                Section {
                    Button("Skip to the slider") {
                        model.endMatching()
                        onSlider(step.rawValue <= Step.kind.rawValue ? spec.startHz : current)
                    }
                }
            }
        }
        .onAppear { titleFocused = true }
        .onChange(of: step) { titleFocused = true }
        .onChange(of: round) { titleFocused = true }
    }

    // Separate literals (not a ?: of strings) so each is looked up for translation
    @ViewBuilder private var title: some View {
        switch step {
        case .start: Text("Before you start")
        case .level: Text("Set a comfortable level")
        case .kind: Text("Whistle or hiss?")
        case .ladder: Text("Get close")
        case .refine: Text("Narrow it down, round \(round + 1) of \(spec.refineStepsSemitones.count)")
        case .octave: Text("One more check: which is most like it?")
        case .done: Text("Done")
        }
    }

    @ViewBuilder private var content: some View {
        switch step {
        case .start: startStep
        case .level: levelStep
        case .kind: kindStep
        case .ladder: ladderStep
        case .refine: refineStep
        case .octave: octaveStep
        case .done: doneStep
        }
    }

    // MARK: 1 · Before you start

    private var startStep: some View {
        Section {
            Text("Put on headphones if you have them, find a quiet room, and turn your phone's volume down.")
            Text("We'll play a few sounds; you pick the one closest to what you hear. It takes about two minutes.")
                .foregroundStyle(.secondary)
            Button("Start", action: startLevel)
                .tint(Color.sage)
        }
    }

    /// Step 2 starts the soft sound at startHz, always at levelStartDb
    private func startLevel() {
        model.beginGuide()
        step = .level
    }

    // MARK: 2 · Set a comfortable level

    private var levelStep: some View {
        Section {
            Text("A soft sound is playing. Raise it until you can just hear it.")
            Text("Stop if the sound is uncomfortable.").foregroundStyle(.secondary)
            VStack(alignment: .leading) {
                Text("Volume")
                Slider(value: $model.matchLevelDB, in: spec.levelMinDb ... spec.levelMaxDb) { Text("Volume") }
                    .tint(Color.sage)
                    .accessibilityValue(Text("\(Int(model.matchLevelDB.rounded())) dB"))
            }
            playButton(spec.startHz, burst: false, play: "Play")
            Button("Next") {
                model.endMatching()
                step = .kind
            }
            .tint(Color.sage)
        }
    }

    // MARK: 3 · Whistle or hiss?

    private var kindStep: some View {
        Section {
            Text("Is it more like a whistle, or more like a hiss?")
            Button("Whistle") { chooseKind(.whistle) }
            Button("Hiss") { chooseKind(.hiss) }
            Button("Not sure") { chooseKind(.unsure) }
        }
        .tint(Color.sage)
    }

    private func chooseKind(_ answer: PitchSpec.SoundAnswer) {
        model.matchSound = PitchSpec.matchSound(for: answer)
        rung = 0
        model.playBurst(at: spec.ladderHz[0])
        step = .ladder
    }

    // MARK: 4 · Get close

    private var ladderStep: some View {
        let hz = spec.ladderHz[rung]
        return Section {
            Text("Listen to each sound and pick the one closest to what you hear.")
            HStack(alignment: .firstTextBaseline) {
                Text("Sound \(rung + 1) of \(spec.ladderHz.count)").font(.title3)
                Text(ContentView.format(hz)).font(.caption).foregroundStyle(.secondary).monospacedDigit()
            }
            .accessibilityElement(children: .combine)
            playButton(hz, burst: true, play: "Play again")
            HStack {
                Button("Previous") { showRung(rung - 1) }
                    .disabled(rung == 0)
                Spacer()
                Button("Next") { showRung(rung + 1) }
                    .disabled(rung == spec.ladderHz.count - 1)
            }
            .buttonStyle(.bordered)
            Button("This is closest") {
                model.endMatching()
                current = hz
                round = 0
                step = .refine
            }
            .tint(Color.sage)
        }
    }

    private func showRung(_ i: Int) {
        rung = i
        model.playBurst(at: spec.ladderHz[i])
        UIAccessibility.post(notification: .announcement,
                             argument: String(localized: "Sound \(i + 1) of \(spec.ladderHz.count)"))
    }

    // MARK: 5 · Narrow it down

    private var refineStep: some View {
        let o = spec.refineOptions(for: current, step: spec.refineStepsSemitones[round])
        return Section {
            Text("Play both. Which is closer to what you hear?")
            if let down = o.down {
                playButton(down, burst: true, play: "Play 1", stop: "Stop 1")
            }
            if let up = o.up {
                playButton(up, burst: true, play: "Play 2", stop: "Stop 2")
            }
            if o.down != nil { Button("1 is closer") { answer(.down) }.tint(Color.sage) }
            if o.up != nil { Button("2 is closer") { answer(.up) }.tint(Color.sage) }
            Button("Not sure") { answer(.unsure) }
        }
    }

    private func answer(_ a: PitchSpec.RefineAnswer) {
        model.endMatching()
        current = spec.refined(current, step: spec.refineStepsSemitones[round], answer: a)
        if round + 1 < spec.refineStepsSemitones.count {
            round += 1
        } else {
            step = spec.octaveCheck ? .octave : .done
            if step == .done { model.pitchTutorialDone = true }
        }
    }

    // MARK: 6 · Octave check

    private var octaveStep: some View {
        Group {
            Section {
                Text("It's easy to land on the right note in the wrong octave. Play each one and choose the closest.")
                    .foregroundStyle(.secondary)
            }
            Section {
                OctaveOptionsList(model: model, chosen: current, burst: true, onChoose: finishOctave)
            }
            Section {
                Button("Skip") { finishOctave(current) }
            }
        }
    }

    private func finishOctave(_ hz: Double) {
        model.endMatching()
        current = hz
        model.pitchTutorialDone = true
        step = .done
    }

    // MARK: 7 · Done

    private var doneStep: some View {
        Section {
            Text("Sound centred around \(ContentView.format(current))").font(.title3)
            Button("Use this pitch") {
                model.useMatchedPitch(current)
                onDone()
            }
            .tint(Color.sage)
            Button("Fine-tune with the slider") { onSlider(current) }
            Button("Start again", action: startLevel)
        } footer: {
            Text("Your pitch is kept on this phone only.")
        }
    }

    // MARK: Play / Stop

    /// Plays `hz` (for guidePlaySeconds if `burst`), or stops it if it's playing.
    /// The label changes to Stop, with a different symbol, so it isn't shown by colour alone.
    private func playButton(_ hz: Double, burst: Bool, play: LocalizedStringKey,
                            stop: LocalizedStringKey = "Stop") -> some View {
        let on = model.matching && model.matchHz == hz
        return Button {
            if on { model.endMatching() } else if burst { model.playBurst(at: hz) } else { model.playMatch(at: hz) }
        } label: {
            if on { Label(stop, systemImage: "stop.fill") } else { Label(play, systemImage: "play.fill") }
        }
        .tint(Color.sage)
    }
}
