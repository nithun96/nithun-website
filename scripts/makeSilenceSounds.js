// Deafening Silence — renders the four sounds to audio files.
//
// `npm run make-sounds` (needs ffmpeg) writes to public/sounds/:
//   silence-<sound>-loop.m4a  — 5 min + 1 s. The player starts a second copy
//                               1 s before the first ends; the 1 s fades at both
//                               ends make that overlap a seamless crossfade.
//   silence-<sound>-end.m4a   — the same, but fading out over its last 60 s.
//                               The sleep timer hands over to this one last.
// The recipes are the ones the page used to generate live with the Web Audio API
// (see git history for src/audio/noiseEngine.js). Playing files instead lets the
// sound continue on a locked iPhone. Change a recipe or level → re-run, and give
// the files new names (they are cached, see nginx/nithun-website).

import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import { Buffer } from 'buffer'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/sounds')

const RATE = 44100
const LOOP_SECS = 300       // a new copy starts every 5 minutes …
const OVERLAP_SECS = 1      // … overlapping the old one by 1 s (must match src/audio/loopPlayer.js)
const END_FADE_SECS = 60    // the sleep timer's fade-out
const TARGET_LUFS = -20     // same loudness for every sound
const BITRATE = '96k'
const N = (LOOP_SECS + OVERLAP_SECS) * RATE

// Every slow rhythm below (ocean waves, rain swell) repeats a whole number of
// times in LOOP_SECS, so it lines up across the crossfade.

// Seeded random numbers, so a re-run gives the same files
function random(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1   // −1 … 1
  }
}

function white(rand) {
  const d = new Float32Array(N)
  for (let i = 0; i < N; i++) d[i] = rand()
  return d
}

// Paul Kellet's filter — approximates a 1/f spectrum
function pink(rand) {
  const d = new Float32Array(N)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < N; i++) {
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
function brown(rand) {
  const d = new Float32Array(N)
  let last = 0
  for (let i = 0; i < N; i++) {
    last = (last + 0.02 * rand()) / 1.02
    d[i] = last * 3.5
  }
  return d
}

// Biquad filters as the Web Audio API defines them (Audio EQ Cookbook;
// lowpass/highpass Q is in dB there)
function biquad(input, type, freq, Q) {
  const w0 = 2 * Math.PI * freq / RATE
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

const sine = (hz, i) => Math.sin(2 * Math.PI * hz * i / RATE)

const SOUNDS = {
  brown: () => brown(random(1)),
  pink:  () => pink(random(2)),

  // White noise under a slow swell (0.08 Hz, one wave every 12.5 s)
  ocean: () => {
    const d = white(random(3))
    for (let i = 0; i < N; i++) d[i] *= (sine(0.08, i) * 0.4 + 0.6) * 0.55
    return d
  },

  // Three layers: a steady wash, a low rumble, and drop texture that swells
  // (0.2 Hz), patters (2 Hz) and has rare random spikes for single drops
  rain: () => {
    const body   = biquad(white(random(4)), 'bandpass', 1500, 2.0)
    const rumble = biquad(brown(random(5)), 'lowpass', 150, 0.5)
    const drops  = biquad(pink(random(6)), 'highpass', 2500, 0.7)
    const rand = random(7)
    const d = new Float32Array(N)
    let spike = 0
    for (let i = 0; i < N; i++) {
      if ((rand() + 1) / 2 < 0.00003) spike = (rand() + 1) / 2 * 0.15
      spike *= 0.9997
      const dropGain = 0.30 + 0.06 * sine(0.2, i) + 0.04 * sine(2, i) + spike
      d[i] = body[i] * 0.50 + rumble[i] * 0.20 + drops[i] * dropGain
    }
    return d
  },
}

// Equal-power fades: two unrelated noises crossfaded this way keep a steady level
function loopFades(d) {
  const f = OVERLAP_SECS * RATE
  for (let i = 0; i < f; i++) {
    d[i] *= Math.sin(Math.PI / 2 * i / f)
    d[N - 1 - i] *= Math.sin(Math.PI / 2 * i / f)
  }
}
function endFades(d) {
  const f = OVERLAP_SECS * RATE, e = END_FADE_SECS * RATE
  for (let i = 0; i < f; i++) d[i] *= Math.sin(Math.PI / 2 * i / f)
  for (let i = 0; i < e; i++) d[N - 1 - i] *= i / e
}

function wav(path, d) {
  const buf = Buffer.alloc(44 + d.length * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + d.length * 4, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20)   // 3 = float
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 4, 28)
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(32, 34)
  buf.write('data', 36); buf.writeUInt32LE(d.length * 4, 40)
  for (let i = 0; i < d.length; i++) buf.writeFloatLE(d[i], 44 + i * 4)
  writeFileSync(path, buf)
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf-8' })
  if (r.error) throw new Error('ffmpeg not found — install it first')
  if (r.status !== 0) throw new Error(r.stderr)
  return r.stderr
}

function loudness(path) {
  const log = ffmpeg(['-i', path, '-af', 'ebur128', '-f', 'null', '-'])
  const m = [...log.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop()
  return parseFloat(m[1])
}

function encode(wavPath, gainDb, name) {
  ffmpeg(['-y', '-i', wavPath, '-af', `volume=${gainDb.toFixed(2)}dB`,
    '-c:a', 'aac', '-b:a', BITRATE, '-movflags', '+faststart', resolve(out, name)])
}

mkdirSync(out, { recursive: true })
const tmp = resolve(tmpdir(), 'silence-sounds')
mkdirSync(tmp, { recursive: true })

for (const [name, make] of Object.entries(SOUNDS)) {
  const raw = make()
  // Measure loudness on the unfaded sound, then apply the same gain to both files
  const rawPath = resolve(tmp, `${name}-raw.wav`)
  wav(rawPath, raw)
  const gainDb = TARGET_LUFS - loudness(rawPath)
  let peak = 0
  for (const s of raw) peak = Math.max(peak, Math.abs(s))
  const peakDb = 20 * Math.log10(peak) + gainDb
  if (peakDb > -1) console.warn(`  ${name}: peak ${peakDb.toFixed(1)} dBFS — lower TARGET_LUFS`)

  const loop = Float32Array.from(raw); loopFades(loop)
  const end = Float32Array.from(raw); endFades(end)
  wav(resolve(tmp, `${name}-loop.wav`), loop)
  wav(resolve(tmp, `${name}-end.wav`), end)
  encode(resolve(tmp, `${name}-loop.wav`), gainDb, `silence-${name}-loop.m4a`)
  encode(resolve(tmp, `${name}-end.wav`), gainDb, `silence-${name}-end.m4a`)
  console.log(`${name}: gain ${gainDb.toFixed(1)} dB, peak ${peakDb.toFixed(1)} dBFS`)
}

rmSync(tmp, { recursive: true, force: true })
