# Silence for iOS

Blanketing Silence, the iPhone and iPad companion to the Silence tool at nithun.no/silence. It has four sounds made
from numbers, a sleep timer that fades out over its last minute, and playback that
keeps going with the screen locked.

Native SwiftUI + AVAudioEngine. The sounds are a straight port of the website's
`src/audio/noiseRecipes.js`, and a test checks that the samples match.

## Run it

1. Install Xcode (Mac App Store) and XcodeGen: `brew install xcodegen`
2. In the `ios` folder: `xcodegen`, then open `Silence.xcodeproj`
3. Pick an iPhone simulator, press ⌘R. ⌘U runs the tests.
4. On your own iPhone: Signing & Capabilities → choose your team.

The Xcode project is generated from `project.yml`; change settings there, not in Xcode.

## Keeping the app and the website in step

The app lives in the website's repo (`ios/`) so both versions of the sounds change
together. `src/audio/noiseRecipes.js` (website) and `Silence/Audio/NoiseRecipes.swift`
(app) are the same recipes; change one, change the other in the same PR.

The **Silence sounds** GitHub check guards this:
1. It remakes `tools/golden.json` from the website's recipes and fails if the file
   in the repo is different — i.e. the site's sound changed and the app wasn't told.
2. On a Mac runner it builds the app and runs the tests, which compare the Swift
   sound to `tools/golden.json`.

After changing a sound on the website, from the repo root:

    node ios/tools/golden.mjs src/audio/noiseRecipes.js > ios/tools/golden.json

then port the change to the Swift file until the check passes.

Text: the app's English and Norwegian text is in `Silence/Localizable.xcstrings`,
copied from `src/locales/*/translation.json` (`silence.*`). Not checked
automatically; update both when wording changes.

## Structure

- `Silence/` — the app. `SilenceModel.shared` is the one model: the screen, Siri,
  Shortcuts and the Control Centre button all drive the same player.
- `SilenceWidgets/` — widget extension: the sleep timer's Live Activity and the
  iOS 18 Control Centre button. It only draws; sound always plays in the app.
- `Shared/` — compiled into both: the Live Activity's data, the intents behind
  its buttons, the sage colour. Code here that should run only in the app sits
  inside `#if SILENCE_APP`.
- Text: `Silence/Localizable.xcstrings` (app), `Silence/AppShortcuts.xcstrings`
  (Siri phrases), `SilenceWidgets/Localizable.xcstrings` (extension).

## Status (22.11.2026)

1.1, reach it without opening the app (built and tested on the GitHub Mac, not yet
on a phone):
- Siri and Shortcuts: "Play rain in Silence", "Play Silence for an hour", "Stop
  Silence" (and in Norwegian: "Spill regn i Silence", "Stopp Silence"). In the
  Shortcuts app, "Play a sound" takes any sound and 1 to 720 minutes. A timer set
  this way becomes the app's timer, as if picked on the screen.
- Sleep timer on the lock screen and Dynamic Island (Live Activity) while a sound
  plays with a timer, with a Stop button.
- Control Centre / lock-screen button (iOS 18 and later): plays your last sound, or
  stops it.
The Norwegian Siri phrases and labels are Claude's draft; check them.

1.0 (17.11.2026):

Done: sound port, player (background audio, lock-screen controls, interruptions,
headphones unplugged), sleep timer, volume, "Your sound" (tone slider, tinnitus
pitch match, focus on that pitch), doctor reminder, privacy link, settings kept on
the phone, English and Norwegian (Bokmål) text, reference-sample test.
Norwegian text for the new features is Claude's draft; check it.

Builds and passes its tests on the GitHub Mac runner; not yet run on a phone.

Still to do before the App Store:
- App design (current screen is functional only), app icon
- Bundle ID and app name confirmed (placeholder `no.nithun.silence`, "Silence")
- Privacy policy page at nithun.no/silence/privacy (linked from the app); App Privacy label "Data Not Collected"
- Screenshots, description and keywords (EN + NO)
- TestFlight on a real iPhone: lock screen, calls, AirPods, timer while locked

See ROADMAP.md for what comes after 1.0.
