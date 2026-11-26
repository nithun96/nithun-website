// Blanketing Silence — player
//
// Makes the sound live with the Web Audio API (recipes in noiseRecipes.js): one
// 50-second loop per sound, played without a gap. Before the audio starts, the
// page asks for the "playback" audio session (Safari 16.4+), so on an iPhone the
// sound ignores the mute switch, keeps playing when the phone is locked and shows
// lock-screen controls (tested on an iPhone, Nov 2026). Older iPhones stop the
// sound when the phone locks.
//
// The sleep timer runs on the audio clock (a 60 s fade, then stop), so it is exact
// and works while the phone is locked, when the page's own timers may be paused.
//
// Your sound (as in the iOS app): every player's sound passes through one shared
// EQ that tilts it darker or brighter and, optionally, lifts the octave around the
// pitch a visitor matched to their tinnitus. So the setting applies wherever
// Silence plays: the Silence page, the homepage thumbnail and "Read with sound".
// A separate quiet tone or hiss is used only while matching. Settings and maths
// are in yourSound.js.

import { makeLoop } from './noiseRecipes'
import {
  LOW_SHELF_HZ, HIGH_SHELF_HZ, FOCUS_DB, FOCUS_Q,
  clampTone, clampHz, clampToneDb, dbToGain, shelfGains, headroomDb,
  HISS_Q, hissGain, cleanMatchSound, loadSettings, saveSettings,
} from './yourSound'

const FADE_SECS = 60
const SMOOTH = 0.03   // seconds: EQ and tone changes glide, so there are no clicks

// One audio engine for the whole site: iPhones allow only a few at once, and
// every visit to Silence or the homepage makes a new player
let shared = null
let eq = null              // { input, low, high, focus, headroom } on the shared engine
let settings = null        // { tone, matchedHz, focusOn, matchSound }, loaded on first use
let playingCount = 0       // players making sound right now
let matching = null        // the matching sound (tone and hiss), while it plays

function yourSound() {
  return settings ||= loadSettings()
}

function engine() {
  if (!shared) {
    shared = new AudioContext()
    const low = shared.createBiquadFilter()
    low.type = 'lowshelf'
    low.frequency.value = LOW_SHELF_HZ
    const high = shared.createBiquadFilter()
    high.type = 'highshelf'
    high.frequency.value = HIGH_SHELF_HZ
    const focus = shared.createBiquadFilter()
    focus.type = 'peaking'
    focus.Q.value = FOCUS_Q
    const headroom = shared.createGain()
    low.connect(high).connect(focus).connect(headroom).connect(shared.destination)
    eq = { input: low, low, high, focus, headroom }
    applyEq(true)
  }
  return shared
}

// Set the EQ from the settings. `now` sets it at once (a new engine); otherwise
// it glides there, so moving the slider while a sound plays is click-free.
function applyEq(now = false) {
  if (!eq) return
  const { tone, matchedHz, focusOn } = yourSound()
  const on = focusOn && matchedHz !== null
  const { low, high } = shelfGains(tone)
  const set = (param, value) => now
    ? (param.value = value)
    : param.setTargetAtTime(value, shared.currentTime, SMOOTH)
  set(eq.low.gain, low)
  set(eq.high.gain, high)
  if (matchedHz !== null) set(eq.focus.frequency, matchedHz)
  set(eq.focus.gain, on ? FOCUS_DB : 0)    // 0 dB = no change
  set(eq.headroom.gain, dbToGain(headroomDb(tone, on)))
}

function update(changes) {
  settings = { ...yourSound(), ...changes }
  if (settings.matchedHz === null) settings.focusOn = false
  saveSettings(settings)
  applyEq()
  return settings
}

/** The visitor's sound settings: { tone, matchedHz, focusOn, matchSound }. */
export function getYourSound() {
  return yourSound()
}

/** Tilt the sound: −1 darker … 0 as made … 1 brighter. Applied live. */
export function setTone(t) {
  return update({ tone: clampTone(t) })
}

/** Turn the lift around the matched pitch on or off (only with a pitch). */
export function setFocus(on) {
  return update({ focusOn: !!on })
}

/** Keep a matched pitch and turn the focus on (null forgets it). */
export function setMatchedPitch(hz) {
  return hz === null
    ? update({ matchedHz: null, focusOn: false })
    : update({ matchedHz: clampHz(hz), focusOn: true })
}

// Let go of the audio session (and the lock-screen controls) when nothing sounds
function releaseIfIdle() {
  if (playingCount === 0 && !matching && shared?.state === 'running') shared.suspend()
}

/**
 * The matching sound: a quiet sine tone, or a soft hiss (white noise through a
 * band-pass one-third of an octave wide, centred on the pitch), that the visitor
 * moves to the pitch of their tinnitus. Both are built and both run; only the
 * chosen one is turned up, so switching is a short crossfade with no click. The
 * hiss is amplified to be as loud as the tone at the same level (see hissGain in
 * yourSound.js). The level always starts at −50 dBFS and can never go above
 * −20 dBFS. It goes straight to the speakers: not through the EQ, and not the
 * volume slider. Stop any sound before starting it. `onEnd` is told if it stops
 * by itself.
 */
export function startMatchTone(hz, levelDb, onEnd, kind = 'tone') {
  stopMatchTone()
  if ('audioSession' in navigator) navigator.audioSession.type = 'playback'
  const c = engine()
  const resumed = c.resume()   // inside the tap
  const osc = c.createOscillator()
  const toneGain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = clampHz(hz)
  toneGain.gain.value = 0      // fades in, no click
  osc.connect(toneGain).connect(c.destination)

  // Two seconds of white noise, looped: noise has no pattern, so the seam can't be heard
  const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = noise
  src.loop = true
  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = HISS_Q
  band.frequency.value = clampHz(hz)
  const hissGainNode = c.createGain()
  hissGainNode.gain.value = 0
  src.connect(band).connect(hissGainNode).connect(c.destination)

  osc.start()
  src.start()
  const onState = () => { if (c.state === 'interrupted') stopMatchTone(true) }
  c.addEventListener('statechange', onState)
  matching = { osc, toneGain, src, band, hissGainNode, onState, onEnd }
  setMatchTone(hz, levelDb, kind)
  return resumed
}

/** Move the matching sound's pitch (Hz), level (dBFS, capped at −20) and kind ('tone' or 'hiss'). */
export function setMatchTone(hz, levelDb, kind = 'tone') {
  if (!matching) return
  const now = shared.currentTime
  const f = clampHz(hz)
  const hiss = cleanMatchSound(kind) === 'hiss'
  matching.osc.frequency.setTargetAtTime(f, now, SMOOTH)
  matching.band.frequency.setTargetAtTime(f, now, SMOOTH)
  matching.toneGain.gain.setTargetAtTime(hiss ? 0 : dbToGain(clampToneDb(levelDb)), now, SMOOTH)
  matching.hissGainNode.gain.setTargetAtTime(hiss ? hissGain(f, shared.sampleRate, levelDb) : 0, now, SMOOTH)
}

/** Stop the matching sound. `tell` lets the page know (when a sound took over). */
export function stopMatchTone(tell = false) {
  if (!matching) return
  const { osc, toneGain, src, band, hissGainNode, onState, onEnd } = matching
  matching = null
  shared.removeEventListener('statechange', onState)
  const now = shared.currentTime
  toneGain.gain.setTargetAtTime(0, now, SMOOTH)   // fade out, then stop
  hissGainNode.gain.setTargetAtTime(0, now, SMOOTH)
  osc.stop(now + 0.15)
  src.stop(now + 0.15)
  osc.onended = () => {
    osc.disconnect(); toneGain.disconnect()
    src.disconnect(); band.disconnect(); hissGainNode.disconnect()
    releaseIfIdle()
  }
  if (tell) onEnd?.()
}

/** Remember which sound to compare with ('tone' or 'hiss'). */
export function setMatchSound(kind) {
  return update({ matchSound: cleanMatchSound(kind) })
}

export function createNoisePlayer(onChange) {
  let ctx = null
  let volumeNode = null     // the volume slider
  let fadeNode = null       // the sleep timer's fade
  let source = null
  let sound = null          // id of the sound playing, or null
  let title = ''
  let volume = 1
  let timerMinutes = null
  let endsAt = null         // when the sound stops (ms), or null
  let cached = null         // { id, rate, buffer } — the last sound made, so a replay is instant

  function audio() {
    if ('audioSession' in navigator) navigator.audioSession.type = 'playback'
    if (!ctx) {
      ctx = engine()
      volumeNode = ctx.createGain()
      volumeNode.gain.value = volume
      volumeNode.connect(eq.input)
      // Another app taking over the sound (a call, a video) interrupts it (Safari's
      // "interrupted" state): count that as stopped, so the page doesn't show a
      // sound that isn't playing
      ctx.addEventListener('statechange', () => {
        if (sound !== null && ctx.state === 'interrupted') stop()
      })
    }
    return ctx
  }

  function bufferFor(id) {
    if (cached?.id !== id || cached.rate !== ctx.sampleRate) {
      const data = makeLoop(id, ctx.sampleRate)
      const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate)
      buffer.copyToChannel(data, 0)
      cached = { id, rate: ctx.sampleRate, buffer }
    }
    return cached.buffer
  }

  // Schedule (or clear) the sleep timer on the audio clock
  function scheduleTimer() {
    const now = ctx.currentTime
    const gain = fadeNode.gain
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now)   // keep the level mid-fade
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now) }
    if (!timerMinutes) {
      endsAt = null
      gain.linearRampToValueAtTime(1, now + 0.5)
      source.stop(now + 1e9)   // a later stop() call replaces an earlier one
      return
    }
    const secs = timerMinutes * 60
    endsAt = Date.now() + secs * 1000
    const fadeAt = now + Math.max(0, secs - FADE_SECS)
    gain.linearRampToValueAtTime(1, Math.min(now + 0.5, fadeAt + 0.5))
    gain.setValueAtTime(1, fadeAt)
    gain.linearRampToValueAtTime(0, now + secs)
    source.stop(now + secs)
  }

  function setMediaSession() {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = sound ? new MediaMetadata({ title, artist: 'Blanketing Silence' }) : null
    navigator.mediaSession.playbackState = sound ? 'playing' : 'none'
    navigator.mediaSession.setActionHandler('pause', sound ? () => stop() : null)
    navigator.mediaSession.setActionHandler('stop', sound ? () => stop() : null)
    navigator.mediaSession.setActionHandler('play', sound ? () => ctx.resume() : null)
  }

  /** Start a sound. Call from a tap. Resolves when it plays; rejects if it can't. */
  async function play(id, label) {
    stop(true)
    stopMatchTone(true)   // a sound and the matching tone never play together
    const c = audio()
    const resumed = c.resume()   // inside the tap, before anything slow
    sound = id
    title = label
    playingCount++
    onChange?.(sound)

    fadeNode = c.createGain()
    fadeNode.connect(volumeNode)
    source = c.createBufferSource()
    source.buffer = bufferFor(id)
    source.loop = true
    source.connect(fadeNode)
    const s = source
    s.onended = () => { if (source === s) stop() }   // the sleep timer ran out
    s.start()
    scheduleTimer()
    setMediaSession()

    try {
      await resumed
    } catch (err) {
      if (source === s) stop()
      throw err
    }
  }

  /** Stop. `quiet` skips telling the page (play() tells it the new sound). */
  function stop(quiet = false) {
    const wasPlaying = sound !== null
    if (wasPlaying) playingCount--
    sound = null
    endsAt = null
    if (source) {
      source.onended = null
      try { source.stop() } catch { /* not started */ }
      source.disconnect()
      fadeNode.disconnect()
      source = fadeNode = null
    }
    setMediaSession()
    // Let go of the audio session (and the lock-screen controls) until the next play
    if (!quiet) releaseIfIdle()
    if (wasPlaying && !quiet) onChange?.(null)
  }

  /** Set or clear the sleep timer (minutes or null). */
  function setTimer(minutes) {
    timerMinutes = minutes
    if (sound !== null) scheduleTimer()
  }

  /** When the sound will stop (ms), or null. */
  function stopsAt() {
    return sound === null ? null : endsAt
  }

  function setVolume(v) {
    volume = v
    if (volumeNode) volumeNode.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
  }

  return { play, stop, setTimer, stopsAt, setVolume }
}
