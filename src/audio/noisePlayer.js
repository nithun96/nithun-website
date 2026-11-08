// Deafening Silence — player
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

import { makeLoop } from './noiseRecipes'

const FADE_SECS = 60

// One audio engine for the whole site: iPhones allow only a few at once, and
// every visit to Silence or the homepage makes a new player
let shared = null

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
      ctx = shared ||= new AudioContext()
      volumeNode = ctx.createGain()
      volumeNode.gain.value = volume
      volumeNode.connect(ctx.destination)
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
    navigator.mediaSession.metadata = sound ? new MediaMetadata({ title, artist: 'Deafening Silence' }) : null
    navigator.mediaSession.playbackState = sound ? 'playing' : 'none'
    navigator.mediaSession.setActionHandler('pause', sound ? () => stop() : null)
    navigator.mediaSession.setActionHandler('stop', sound ? () => stop() : null)
    navigator.mediaSession.setActionHandler('play', sound ? () => ctx.resume() : null)
  }

  /** Start a sound. Call from a tap. Resolves when it plays; rejects if it can't. */
  async function play(id, label) {
    stop(true)
    const c = audio()
    const resumed = c.resume()   // inside the tap, before anything slow
    sound = id
    title = label
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
    if (!quiet && ctx?.state === 'running') ctx.suspend()
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
