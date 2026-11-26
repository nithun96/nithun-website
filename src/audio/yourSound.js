// Your sound — the settings and the arithmetic behind them, the same as the iOS
// app (ios/Silence/SilenceModel.swift, NoisePlayer.swift, MatchView.swift, PitchSpec.swift).
//
// - Tone: −1 darker … 0 as made … 1 brighter. A low shelf at 300 Hz gets −6t dB
//   and a high shelf at 3 kHz +6t dB.
// - Matched pitch: the frequency (Hz) a visitor matched to their tinnitus with a
//   quiet sine tone or a soft hiss around one pitch (they choose). "Focus on my pitch" lifts the octave around it by 6 dB.
// - Headroom: boosting could push peaks past full scale, so the whole sound comes
//   down by half the boost, and 4 dB more while the focus is on.
//
// Settings are kept in this browser only (localStorage). Nothing is sent anywhere.
//
// The matching limits (pitch range, level start and cap, hiss width) come from
// shared/silence-pitch-spec.json, which the iOS app reads too, so the two can't
// drift apart. scripts/test-pitch-spec.mjs checks these helpers honour it.

import SPEC from '../../shared/silence-pitch-spec.json' with { type: 'json' }

export { SPEC }

export const TONE_DB = 6               // shelf gain at the ends of the tone slider
export const LOW_SHELF_HZ = 300
export const HIGH_SHELF_HZ = 3000
export const FOCUS_DB = 6
export const FOCUS_Q = Math.SQRT2      // one octave wide: Q = √(2^N) / (2^N − 1), N = 1
export const FOCUS_HEADROOM_DB = 4

// Matching sound (a tone or a hiss), from the shared spec
export const LOW_HZ = SPEC.minHz
export const HIGH_HZ = SPEC.maxHz
export const START_HZ = SPEC.startHz         // where matching starts if nothing is matched yet
export const MIN_TONE_DB = SPEC.levelMinDb
export const MAX_TONE_DB = SPEC.levelMaxDb   // the sound can never be louder than this
export const START_TONE_DB = SPEC.levelStartDb   // and always starts here
const SEMITONE = Math.pow(2, 1 / 12)

/** The two sounds you can compare with your tinnitus. */
export const MATCH_SOUNDS = ['tone', 'hiss']
export const cleanMatchSound = s => (MATCH_SOUNDS.includes(s) ? s : 'tone')

// Hiss: white noise through a band-pass filter centred on the pitch.
// Q for a band N octaves wide: √(2^N) / (2^N − 1). One-third octave → Q ≈ 4.32.
const N = SPEC.hissBandwidthOctaves
export const HISS_Q = Math.sqrt(Math.pow(2, N)) / (Math.pow(2, N) - 1)
export const NOISE_RMS = 1 / Math.sqrt(3)    // white noise spread evenly over −1…1

/**
 * How much to amplify the band-passed noise so the hiss is as loud as the tone
 * at the same slider position.
 *
 * Loudness follows the RMS (average power) of a sound. The tone at level L dBFS
 * is a sine with peak 10^(L/20), so its RMS is that ÷ √2. The hiss starts as
 * white noise (RMS 1/√3) and the band-pass filter (the standard "constant 0 dB
 * peak" band-pass that Web Audio and the app both use) keeps only part of its
 * power: exactly α / (1 + α), where α = sin(2π·f/rate) / (2Q). So the hiss gain
 * is (tone RMS) ÷ (noise RMS × √(α / (1 + α))). It depends on the pitch (a
 * band one-third of an octave wide holds more Hz, so more noise, higher up),
 * so it glides with the pitch. The level cap applies to both sounds alike.
 */
export function hissGain(hz, sampleRate, levelDb) {
  const w = 2 * Math.PI * clampHz(hz) / sampleRate
  const alpha = Math.sin(w) / (2 * HISS_Q)
  const kept = Math.sqrt(alpha / (1 + alpha))
  const toneRms = dbToGain(clampToneDb(levelDb)) / Math.SQRT2
  return toneRms / (NOISE_RMS * kept)
}

/**
 * The octave check after "Use this pitch": the pitch, an octave lower and an
 * octave higher. An option outside the range is left out.
 */
export function octaveOptions(hz) {
  const options = [
    { id: 'lower', hz: hz / 2 },
    { id: 'this', hz },
    { id: 'higher', hz: hz * 2 },
  ]
  return options.filter(o => o.id === 'this' || (o.hz >= LOW_HZ && o.hz <= HIGH_HZ))
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const clampTone = t => clamp(Number.isFinite(t) ? t : 0, -1, 1)
export const clampHz = hz => clamp(hz, LOW_HZ, HIGH_HZ)
export const clampToneDb = db => clamp(Number.isFinite(db) ? db : START_TONE_DB, MIN_TONE_DB, MAX_TONE_DB)
export const dbToGain = db => Math.pow(10, db / 20)

/** Shelf gains (dB) for a tone setting. */
export function shelfGains(tone) {
  const db = clampTone(tone) * TONE_DB
  return { low: -db, high: db }
}

/** How much to bring the whole sound down (dB, ≤ 0) so boosts don't clip. */
export function headroomDb(tone, focusOn) {
  const { low, high } = shelfGains(tone)
  const boost = Math.max(0, low, high)
  return -(boost / 2) - (focusOn ? FOCUS_HEADROOM_DB : 0)
}

/** The pitch slider runs along a log scale: 0 → 250 Hz, 1 → 12 kHz. */
export const positionToHz = p => LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, clamp(p, 0, 1))
export const hzToPosition = hz => Math.log(clampHz(hz) / LOW_HZ) / Math.log(HIGH_HZ / LOW_HZ)

/** One semitone up or down, for fine tuning. */
export const semitoneUp = hz => clampHz(hz * SEMITONE)
export const semitoneDown = hz => clampHz(hz / SEMITONE)

/** "4.0 kHz" / "850 Hz", with the language's decimal mark. */
export function formatHz(hz, lang = 'en') {
  const locale = lang?.startsWith('no') ? 'nb-NO' : 'en-GB'
  return hz >= 1000
    ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(hz / 1000)} kHz`
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(hz))} Hz`
}

// ── Kept in this browser ──────────────────────────────────────

const KEYS = { tone: 'silence.tone', matchedHz: 'silence.matchedHz', focusOn: 'silence.focusOn', matchSound: 'silence.matchSound' }

function read(key) {
  try { return globalThis.localStorage?.getItem(key) ?? null } catch { return null }
}

function write(key, value) {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key)
    else globalThis.localStorage?.setItem(key, String(value))
  } catch { /* private mode or storage full: the setting just isn't remembered */ }
}

/** The saved settings, cleaned up (anything odd falls back to the default). */
export function loadSettings() {
  const tone = clampTone(parseFloat(read(KEYS.tone)))
  const hz = parseFloat(read(KEYS.matchedHz))
  const matchedHz = Number.isFinite(hz) && hz >= LOW_HZ && hz <= HIGH_HZ ? hz : null
  const focusOn = matchedHz !== null && read(KEYS.focusOn) === 'true'
  const matchSound = cleanMatchSound(read(KEYS.matchSound))
  return { tone, matchedHz, focusOn, matchSound }
}

export function saveSettings({ tone, matchedHz, focusOn, matchSound }) {
  write(KEYS.tone, tone)
  write(KEYS.matchedHz, matchedHz)
  write(KEYS.focusOn, focusOn)
  write(KEYS.matchSound, cleanMatchSound(matchSound))
}
