// SPDX-License-Identifier: AGPL-3.0-only
// Deafening Silence — player
//
// Plays the files made by scripts/makeSilenceSounds.js with ordinary <audio>
// elements. Unlike the Web Audio API, these keep playing on a locked iPhone and
// ignore the mute switch.
//
// Each loop file is 5 min + 1 s, with 1 s fades at both ends. A second copy
// starts 1 s before the first ends, so the two crossfade with no gap (looping a
// single file leaves an audible pause on iPhone). Each copy also loops by itself,
// so if a handover is ever blocked the sound dips instead of stopping.
//
// Sleep timer: at the handover nearest the chosen time, the next copy is the
// "end" file, which fades out over its last 60 s. iPhones don't let a page change
// the volume, so the fade has to be in the file.
//
// iOS only lets a page start an <audio> element without a tap once that element
// has played after one. So every element is started inside a tap (play() or
// setTimer()) before it may be needed while the phone is locked.

const OVERLAP = 1   // seconds; must match scripts/makeSilenceSounds.js
const LOOP = 300    // seconds between handovers (file length − OVERLAP)
const LENGTH = LOOP + OVERLAP
const LAST_CALL = (LOOP * 1.5 + OVERLAP) * 1000   // end file if the timer is due within this
const file = (sound, kind) => `/sounds/silence-${sound}-${kind}.m4a`
// Seconds left in an element (its duration can be NaN before it loads, or Infinity)
const left = el => (Number.isFinite(el.duration) ? el.duration : LENGTH) - el.currentTime

// iPhones and iPads ignore audio.volume; the volume buttons set it instead
export const canSetVolume = (() => {
  if (typeof Audio === 'undefined') return false
  const a = new Audio()
  a.volume = 0.5
  return a.volume === 0.5
})()

export function createLoopPlayer(onChange) {
  const loops = [new Audio(), new Audio()]
  const end = new Audio()
  const all = [...loops, end]
  let current = 0          // index in loops of the copy playing now
  let sound = null         // id of the sound playing, or null
  let title = ''
  let volume = 1
  let timerMinutes = null
  let endsAt = null        // when the user asked the sound to stop (ms), or null
  let ending = false       // the end file is playing
  let session = 0          // bumped on stop, so stale callbacks do nothing
  let handoverId = null
  let backstopId = null

  const isCurrent = s => s === session && sound !== null

  // Start an element inside a tap, then pause it, so it may start later without one
  function unlock(el) {
    return el.play().then(() => { el.pause(); el.currentTime = 0 })
  }

  function scheduleHandover(s) {
    clearTimeout(handoverId)
    const ms = (left(loops[current]) - OVERLAP) * 1000
    handoverId = setTimeout(() => handover(s), Math.max(0, ms))
  }

  function handover(s) {
    if (!isCurrent(s)) return
    const old = loops[current]
    // Too early (or the copy already looped by itself): wait for the right moment
    if (left(old) > OVERLAP + 0.5) return scheduleHandover(s)

    const last = endsAt !== null && endsAt - Date.now() <= LAST_CALL
    const next = last ? end : loops[1 - current]
    next.currentTime = 0
    next.play().then(() => {
      if (!isCurrent(s)) { next.pause(); return }
      setTimeout(() => old.pause(), (OVERLAP + 0.2) * 1000)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
      if (last) ending = true
      else { current = 1 - current; scheduleHandover(s) }
    }).catch(() => {
      if (!isCurrent(s)) return
      if (last) stop()   // the end file was blocked: stop now rather than play on
      else handoverId = setTimeout(() => scheduleHandover(s), 2000)   // old copy loops; try next time
    })
  }

  // If anything above fails, the timer still stops the sound (without a fade)
  function setBackstop(s) {
    clearTimeout(backstopId)
    if (endsAt === null) return
    const ms = endsAt - Date.now() + LAST_CALL + 10000
    backstopId = setTimeout(() => isCurrent(s) && stop(), ms)
  }

  function setMediaSession() {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = sound ? new MediaMetadata({ title, artist: 'Deafening Silence' }) : null
    navigator.mediaSession.playbackState = sound ? 'playing' : 'none'
    navigator.mediaSession.setActionHandler('pause', sound ? stop : null)
    navigator.mediaSession.setActionHandler('stop', sound ? stop : null)
  }

  end.addEventListener('ended', () => { if (ending) stop() })

  /** Start a sound. Call from a tap. Resolves when it plays; rejects if it can't. */
  async function play(id, label) {
    stop()
    const s = session
    sound = id
    title = label
    loops.forEach(el => { el.src = file(id, 'loop'); el.loop = true; el.volume = volume })
    end.src = file(id, 'end')
    end.volume = volume
    current = 0
    endsAt = timerMinutes ? Date.now() + timerMinutes * 60000 : null
    // All play() calls happen now, while still inside the tap
    const starting = [loops[0].play(), unlock(loops[1])]
    if (endsAt) starting.push(unlock(end))
    try {
      await Promise.all(starting)
    } catch (err) {
      if (s !== session) return   // replaced by a later tap; not an error
      stop()
      throw err
    }
    if (!isCurrent(s)) return
    scheduleHandover(s)
    setBackstop(s)
    setMediaSession()
    onChange?.(sound)
  }

  function stop() {
    session++
    clearTimeout(handoverId)
    clearTimeout(backstopId)
    all.forEach(el => el.pause())
    const wasPlaying = sound !== null
    sound = null
    ending = false
    endsAt = null
    setMediaSession()
    if (wasPlaying) onChange?.(null)
  }

  /** Set or clear the sleep timer (minutes or null). Call from a tap. */
  function setTimer(minutes) {
    timerMinutes = minutes
    if (sound === null) return
    if (ending) return play(sound, title).catch(() => {})   // already fading out: start afresh
    endsAt = minutes ? Date.now() + minutes * 60000 : null
    if (minutes) unlock(end).catch(() => {})
    setBackstop(session)
  }

  /** When the sound will actually stop (ms), or null. It stops at a handover,
   *  so within about 2.5 minutes of the time asked for. */
  function stopsAt() {
    if (sound === null || endsAt === null) return null
    const now = Date.now()
    if (ending) return now + left(end) * 1000
    let next = now + (left(loops[current]) - OVERLAP) * 1000
    while (endsAt - next > LAST_CALL) next += LOOP * 1000
    return next + LENGTH * 1000
  }

  function setVolume(v) {
    volume = v
    all.forEach(el => { el.volume = v })
  }

  return { play, stop, setTimer, stopsAt, setVolume }
}
