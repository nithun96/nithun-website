# Silence for iOS — roadmap (draft, 17.11.2026)

Unverified draft for Nithun to decide on; nothing here is committed.

**Ground rules for every item:** free, no ads, no accounts, no analytics SDKs, no
network calls. Settings stay on the phone. The app stays small (the sounds are made
on the phone, so there are no audio files to download). The purpose stays tinnitus
and sleep. Every item should also strengthen the 4.3(b) case ("meaningfully
different"), not dilute it.

## 1.0 — App Store, aim to submit by mid-December 2026

- [x] The four sounds (identical to the website), sleep timer, volume, background
      audio, lock-screen controls
- [x] Your sound: tone slider; match your tinnitus pitch; focus on that pitch
- [x] Doctor reminder and privacy link in the app
- [ ] Build in Xcode, fix compile errors, run the tests
- [ ] Design pass (Nithun) and app icon
- [ ] Privacy page at nithun.no/silence/privacy (the app links there already)
- [ ] TestFlight on a real iPhone: locked screen, calls, AirPods out, timer while
      locked, matching tone level at full phone volume
- [ ] Store listing EN + NO, screenshots, review notes explaining what is different

## 1.1 — Reach it without opening the app (native, small)

- Siri and Shortcuts: "Play rain for 60 minutes" (App Intents)
- Control Centre and lock-screen button (iOS 18 controls)
- Sleep timer as a Live Activity on the lock screen
These are cheap with App Intents and are the features a website can't offer.

## 1.2 — More of "your sound"

- Mix two sounds (e.g. rain over brown noise), each with its own level
- Narrow-band noise as a matching option, for tinnitus that isn't a clear tone
- Gentle fade-in at start
- Bring the tone slider to the website, so both stay the same tool

## Later, only if people ask

- Apple Watch remote; Mac (the iPad app runs on Apple silicon Macs)
- Settings synced through iCloud key-value storage (Apple's own, no tracking)
- Crash reports: Apple's opt-in reports in App Store Connect are enough, no SDK

## Deliberately not doing

- "Notched" sound or anything described as therapy or treatment — guideline 1.4.1
  territory, and the evidence is mixed (my reading; not checked here)
- Hearing tests or measurements of any kind
- Accounts, cloud, ads, in-app purchases, donations collected in the app
