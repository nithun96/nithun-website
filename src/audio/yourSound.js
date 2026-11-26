// Your sound — the settings and the arithmetic behind them, the same as the iOS
// app (ios/Silence/SilenceModel.swift, NoisePlayer.swift, MatchView.swift).
//
// - Tone: −1 darker … 0 as made … 1 brighter. A low shelf at 300 Hz gets −6t dB
//   and a high shelf at 3 kHz +6t dB.
// - Matched pitch: the frequency (Hz) a visitor matched to their tinnitus with a
//   quiet sine tone. "Focus on my pitch" lifts the octave around it by 6 dB.
// - Headroom: boosting could push peaks past full scale, so the whole sound comes
//   down by half the boost, and 4 dB more while the focus is on.
//
// Settings are kept in this browser only (localStorage). Nothing is sent anywhere.

export const TONE_DB = 6               // shelf gain at the ends of the tone slider
export const LOW_SHELF_HZ = 300
export const HIGH_SHELF_HZ = 3000
export const FOCUS_DB = 6
export const FOCUS_Q = Math.SQRT2      // one octave wide: Q = √(2^N) / (2^N − 1), N = 1
export const FOCUS_HEADROOM_DB = 4

// Matching tone
export const LOW_HZ = 250
export const HIGH_HZ = 12000
export const START_HZ = 4000           // where matching starts if nothing is matched yet
export const MIN_TONE_DB = -60
export const MAX_TONE_DB = -20         // the tone can never be louder than this
export const START_TONE_DB = -50       // and always starts here
const SEMITONE = Math.pow(2, 1 / 12)

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

const KEYS = { tone: 'silence.tone', matchedHz: 'silence.matchedHz', focusOn: 'silence.focusOn' }

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
  return { tone, matchedHz, focusOn }
}

export function saveSettings({ tone, matchedHz, focusOn }) {
  write(KEYS.tone, tone)
  write(KEYS.matchedHz, matchedHz)
  write(KEYS.focusOn, focusOn)
}
