// Deafening Silence — the four sounds, made from numbers.
//
// The same recipes the sound files used to be rendered from (scripts/makeSilenceSounds.js,
// removed Nov 2026). The page now makes the sound live (src/audio/noisePlayer.js),
// so these run in the browser. Each returns `length` samples at `rate` Hz.

export const LOOP_SECS = 100  // one buffer, looped. Every slow rhythm below repeats a
                              // whole number of times in it, so the loop has no seam.

// Loudness: the gain (dB) that brings each sound to the same level (−20 LUFS),
// measured with ffmpeg's ebur128 on these recipes, as the old files were.
export const GAIN_DB = { brown: -4.4, pink: -5.3, rain: 0.3, ocean: -2.7 }   // ocean: peaks (breaking waves) kept under −1 dBFS, so about 2 dB quieter on average

// Seeded random numbers, so a sound is the same every time
function random(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1   // −1 … 1
  }
}

function white(rand, n) {
  const d = new Float32Array(n)
  for (let i = 0; i < n; i++) d[i] = rand()
  return d
}

// Paul Kellet's filter — approximates a 1/f spectrum
function pink(rand, n) {
  const d = new Float32Array(n)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < n; i++) {
    const w = rand()
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.96900 * b2 + w * 0.1538520
    b3 = 0.86650 * b3 + w * 0.3104856
    b4 = 0.55000 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.0168980
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
  return d
}

// Leaky integrator: a random walk that doesn't drift
function brown(rand, n) {
  const d = new Float32Array(n)
  let last = 0
  for (let i = 0; i < n; i++) {
    last = (last + 0.02 * rand()) / 1.02
    d[i] = last * 3.5
  }
  return d
}

// Biquad filters as the Web Audio API defines them (Audio EQ Cookbook;
// lowpass/highpass Q is in dB there)
function biquad(input, rate, type, freq, Q) {
  const w0 = 2 * Math.PI * freq / rate
  const cos = Math.cos(w0), sin = Math.sin(w0)
  const alpha = type === 'bandpass' ? sin / (2 * Q) : sin / (2 * Math.pow(10, Q / 20))
  let b0, b1, b2
  if (type === 'lowpass')  { b0 = (1 - cos) / 2; b1 = 1 - cos;    b2 = b0 }
  if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0 }
  if (type === 'bandpass') { b0 = alpha;         b1 = 0;          b2 = -alpha }
  const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha
  const d = new Float32Array(input.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x = input[i]
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    x2 = x1; x1 = x; y2 = y1; y1 = y
    d[i] = y
  }
  return d
}

const sine = (hz, i, rate) => Math.sin(2 * Math.PI * hz * i / rate)

export const RECIPES = {
  brown: (rate, n) => brown(random(1), n),
  pink:  (rate, n) => pink(random(2), n),

  // Waves on a beach (Nov 2026; until then a steady hiss under a regular swell,
  // which Nithun found didn't sound like waves). Each wave lasts 9–14 s and has
  // its own strength: it builds slowly, breaks, then washes out. As it breaks the
  // sound gets louder and brighter (a low-pass on pink noise opens up), with a
  // fizz of foam on top; a low rumble runs underneath. The waves fill the loop
  // exactly, so the rhythm carries on across the seam.
  ocean: (rate, n) => {
    const rand = random(3)
    const r01 = () => (rand() + 1) / 2
    const period = LOOP_SECS * rate

    // Wave lengths, scaled to fill the loop exactly
    const lens = []
    let total = 0
    while (total < LOOP_SECS - 9) { const l = 9 + r01() * 5; lens.push(l); total += l }
    const wave = new Float32Array(period)   // 0 … 1: how much the wave is breaking
    let pos = 0
    lens.forEach((l, k) => {
      const size = k === lens.length - 1 ? period - pos : Math.round(l / total * period)
      const peak = 0.4 + r01() * 0.15          // where in the wave it breaks
      const strength = 0.65 + r01() * 0.35
      for (let j = 0; j < size; j++) {
        const t = j / size
        const e = t < peak ? Math.pow(t / peak, 2) : Math.exp(-(t - peak) / ((1 - peak) * 0.3))
        wave[pos + j] = e * strength
      }
      pos += size
    })
    // Smooth the joins between waves (about 0.3 s)
    const smooth = Math.exp(-1 / (0.3 * rate))
    let s = wave[period - 1]
    for (let k = 0; k < 2; k++) for (let i = 0; i < period; i++) { s = s * smooth + wave[i] * (1 - smooth); wave[i] = s }
    const w = i => wave[i % period]

    const body = pink(random(8), n)
    const rumble = biquad(brown(random(9), n), rate, 'lowpass', 120, 0)
    const foam = biquad(white(random(10), n), rate, 'highpass', 3000, 0)
    const d = new Float32Array(n)
    let y = 0, a = 0
    for (let i = 0; i < n; i++) {
      const e = w(i)
      if (i % 32 === 0) a = Math.exp(-2 * Math.PI * (250 + 4500 * Math.pow(e, 1.5)) / rate)
      y = (1 - a) * body[i] + a * y                 // the low-pass that opens as the wave breaks
      d[i] = y * (0.25 + 1.6 * e) + foam[i] * 0.18 * e * e + rumble[i] * (0.35 + 0.25 * e)
    }
    return d
  },

  // Three layers: a steady wash, a low rumble, and drop texture that swells
  // (0.2 Hz), patters (2 Hz) and has rare random spikes for single drops
  rain: (rate, n) => {
    const body   = biquad(white(random(4), n), rate, 'bandpass', 1500, 2.0)
    const rumble = biquad(brown(random(5), n), rate, 'lowpass', 150, 0.5)
    const drops  = biquad(pink(random(6), n), rate, 'highpass', 2500, 0.7)
    const rand = random(7)
    const d = new Float32Array(n)
    let spike = 0
    for (let i = 0; i < n; i++) {
      if ((rand() + 1) / 2 < 0.00003) spike = (rand() + 1) / 2 * 0.15
      spike *= 0.9997
      const dropGain = 0.30 + 0.06 * sine(0.2, i, rate) + 0.04 * sine(2, i, rate) + spike
      d[i] = body[i] * 0.50 + rumble[i] * 0.20 + drops[i] * dropGain
    }
    return d
  },
}

// The old sound files were AAC, which gently cut the very top of the sound; without
// that the live sound is a little brighter. One Butterworth low-pass (Q −3 dB) at
// TOP_HZ gives the same roll-off (within 0.5 dB up to 16 kHz, measured with ffmpeg).
const TOP_HZ = 20000
function softTop(d, rate) {
  if (rate / 2 <= TOP_HZ) return d
  return biquad(d, rate, 'lowpass', TOP_HZ, -3.01)
}

// One loop of a sound, levelled, whose end runs smoothly into its start: one
// extra second is made and crossfaded (equal power) over the first second.
export function makeLoop(id, rate) {
  const n = LOOP_SECS * rate
  const f = rate
  const raw = softTop(RECIPES[id](rate, n + f), rate)
  const gain = Math.pow(10, GAIN_DB[id] / 20)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    out[i] = i < f
      ? raw[i] * Math.sin(Math.PI / 2 * i / f) + raw[n + i] * Math.cos(Math.PI / 2 * i / f)
      : raw[i]
    out[i] *= gain
  }
  return out
}
