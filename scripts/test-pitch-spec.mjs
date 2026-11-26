// Checks that the website's Find-your-pitch helpers (src/audio/yourSound.js) honour
// shared/silence-pitch-spec.json, the settings file the iOS app reads too.
// Run: node scripts/test-pitch-spec.mjs  (also run by the "Silence sounds" check).
// Needs no npm install: yourSound.js is plain maths.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SPEC, LOW_HZ, HIGH_HZ, START_HZ, MIN_TONE_DB, MAX_TONE_DB, START_TONE_DB,
  HISS_Q, NOISE_RMS, clampHz, clampToneDb, dbToGain, positionToHz, hzToPosition,
  semitoneUp, semitoneDown, hissGain, octaveOptions, cleanMatchSound,
  matchSoundFor, refineOptions, refineStep, octaveStep, pitchFromAnswers,
} from '../src/audio/yourSound.js'

const file = JSON.parse(readFileSync(new URL('../shared/silence-pitch-spec.json', import.meta.url), 'utf8'))
let passed = 0
const test = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`) }
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`)

test('the spec has every field, with sensible values', () => {
  for (const k of ['minHz', 'maxHz', 'startHz', 'levelStartDb', 'levelMinDb', 'levelMaxDb',
    'ladderHz', 'refineStepsSemitones', 'refineRule', 'guidePlaySeconds', 'octaveCheck',
    'hissBandwidthOctaves', 'examples']) {
    assert.ok(k in file, `missing ${k}`)
  }
  assert.ok(file.minHz < file.startHz && file.startHz < file.maxHz)
  assert.ok(file.levelMinDb <= file.levelStartDb && file.levelStartDb <= file.levelMaxDb)
  assert.ok(file.levelMaxDb <= -20, 'the cap must stay at or below −20 dBFS')
  assert.equal(file.ladderHz[0], file.minHz)
  assert.equal(file.ladderHz.at(-1), file.maxHz)
  assert.ok(file.ladderHz.every((hz, i) => i === 0 || hz > file.ladderHz[i - 1]))
  assert.equal(typeof file.octaveCheck, 'boolean')
  assert.ok(file.refineStepsSemitones.length > 0 && file.refineStepsSemitones.every(x => x > 0))
  assert.ok(file.guidePlaySeconds > 0 && file.guidePlaySeconds <= 10)
})

test('the website uses the spec, not numbers of its own', () => {
  assert.deepEqual(SPEC, file)
  assert.equal(LOW_HZ, file.minHz)
  assert.equal(HIGH_HZ, file.maxHz)
  assert.equal(START_HZ, file.startHz)
  assert.equal(MIN_TONE_DB, file.levelMinDb)
  assert.equal(MAX_TONE_DB, file.levelMaxDb)
  assert.equal(START_TONE_DB, file.levelStartDb)
})

test('pitch is kept inside minHz…maxHz', () => {
  assert.equal(clampHz(10), file.minHz)
  assert.equal(clampHz(50000), file.maxHz)
  close(positionToHz(0), file.minHz, 1e-9, 'slider start')
  close(positionToHz(1), file.maxHz, 1e-6, 'slider end')
  assert.equal(positionToHz(-1), positionToHz(0))
  assert.equal(positionToHz(2), positionToHz(1))
  close(hzToPosition(positionToHz(0.37)), 0.37, 1e-12, 'slider round trip')
  assert.equal(semitoneUp(file.maxHz), file.maxHz)
  assert.equal(semitoneDown(file.minHz), file.minHz)
})

test('the level never goes past levelMaxDb or below levelMinDb', () => {
  assert.equal(clampToneDb(0), file.levelMaxDb)
  assert.equal(clampToneDb(-19), file.levelMaxDb)
  assert.equal(clampToneDb(-200), file.levelMinDb)
  assert.equal(clampToneDb(NaN), file.levelStartDb)
  // The hiss is capped at the same level: asking for more gives the same gain as the cap
  assert.equal(hissGain(1000, 48000, 0), hissGain(1000, 48000, file.levelMaxDb))
})

test('the hiss is one-third of an octave wide (Q ≈ 4.32)', () => {
  close(HISS_Q, 4.32, 0.01, 'Q')
})

// White noise through the same band-pass as Web Audio's BiquadFilterNode
// ("bandpass", constant 0 dB peak), measured, to check hissGain() makes the hiss
// as loud (same RMS) as the tone at the same level
function hissRms(hz, rate, levelDb) {
  const w = 2 * Math.PI * hz / rate
  const a = Math.sin(w) / (2 * HISS_Q)
  const a0 = 1 + a
  const b0 = a / a0, b2 = -a / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - a) / a0
  let seed = 12345
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1
  const g = hissGain(hz, rate, levelDb)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, sum = 0, peak = 0
  const n = rate * 20
  for (let i = 0; i < n; i++) {
    const x = rand()
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2
    x2 = x1; x1 = x; y2 = y1; y1 = y
    if (i > rate) { sum += (y * g) ** 2; peak = Math.max(peak, Math.abs(y * g)) }
  }
  return { rms: Math.sqrt(sum / (n - rate - 1)), peak }
}

test('the hiss is as loud as the tone at the same slider position (within 0.5 dB)', () => {
  close(NOISE_RMS, 1 / Math.sqrt(3), 1e-12, 'noise RMS')
  for (const rate of [44100, 48000]) {
    for (const hz of [file.minHz, 1000, 4000, file.maxHz]) {
      for (const db of [file.levelStartDb, file.levelMaxDb]) {
        const toneRms = dbToGain(db) / Math.SQRT2
        const { rms } = hissRms(hz, rate, db)
        const diffDb = 20 * Math.log10(rms / toneRms)
        assert.ok(Math.abs(diffDb) < 0.5, `${hz} Hz at ${rate}, ${db} dB: hiss is ${diffDb.toFixed(2)} dB off the tone`)
      }
    }
  }
})

test('the octave check offers lower, this and higher, inside the range', () => {
  assert.deepEqual(octaveOptions(2000).map(o => [o.id, o.hz]), [['lower', 1000], ['this', 2000], ['higher', 4000]])
  assert.deepEqual(octaveOptions(400).map(o => o.id), ['this', 'higher'])       // 200 Hz is below minHz
  assert.deepEqual(octaveOptions(7000).map(o => o.id), ['lower', 'this'])       // 14 kHz is above maxHz
  assert.deepEqual(octaveOptions(file.minHz * 2).map(o => o.id), ['lower', 'this', 'higher'])
  for (const hz of [file.minHz, 333, 1234, 5000, file.maxHz]) {
    for (const o of octaveOptions(hz)) assert.ok(o.hz >= file.minHz && o.hz <= file.maxHz)
  }
})

test('the remembered sound is tone or hiss, tone by default', () => {
  assert.equal(cleanMatchSound('hiss'), 'hiss')
  assert.equal(cleanMatchSound('tone'), 'tone')
  assert.equal(cleanMatchSound(null), 'tone')
  assert.equal(cleanMatchSound('loud'), 'tone')
})

test('the guide: whistle → tone, hiss or not sure → hiss', () => {
  assert.equal(matchSoundFor('whistle'), 'tone')
  assert.equal(matchSoundFor('hiss'), 'hiss')
  assert.equal(matchSoundFor('unsure'), 'hiss')
})

test('the guide: narrowing down follows refineRule', () => {
  const o = refineOptions(1000, 6)
  close(o.down, 1000 / Math.SQRT2, 1e-9, 'down half an octave')
  close(o.up, 1000 * Math.SQRT2, 1e-9, 'up half an octave')
  assert.equal(refineOptions(file.minHz, 6).down, null)          // already at the edge: hidden
  assert.equal(refineOptions(file.maxHz, 1).up, null)
  assert.equal(refineOptions(300, 6).down, file.minHz)           // clamped, still offered
  assert.equal(refineStep(1000, 3, 'unsure'), 1000)
  assert.equal(refineStep(file.minHz, 6, 'down'), file.minHz)     // a hidden option keeps the pitch
  assert.equal(octaveStep(7000, 'higher'), 7000)                  // 14 kHz is hidden
  assert.equal(octaveStep(2000, 'lower'), 1000)
  assert.equal(octaveStep(2000, 'same'), 2000)
  for (const hz of [file.minHz, 777, 4000, file.maxHz]) {
    for (const s of file.refineStepsSemitones) {
      for (const v of Object.values(refineOptions(hz, s))) if (v !== null) assert.ok(v >= file.minHz && v <= file.maxHz)
    }
  }
})

test('the guide: every example in the spec gives its expectedHz (within 0.5 Hz)', () => {
  assert.ok(file.examples.length >= 6)
  for (const e of file.examples) {
    assert.ok(file.ladderHz.includes(e.ladderChoiceHz), `${e.ladderChoiceHz} isn't on the ladder`)
    assert.equal(e.refineAnswers.length, file.refineStepsSemitones.length)
    assert.ok(['tone', 'hiss'].includes(e.matchSound))
    const hz = pitchFromAnswers(e)
    close(hz, e.expectedHz, 0.5, `example ${JSON.stringify(e)}`)
    assert.ok(hz >= file.minHz && hz <= file.maxHz)
  }
  // The examples must reach both edges
  assert.ok(file.examples.some(e => e.expectedHz === file.minHz))
  assert.ok(file.examples.some(e => e.expectedHz === file.maxHz))
})

console.log(`\n${passed} passed`)
