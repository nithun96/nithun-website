// Silence lab (throwaway test, see noise.html): brown noise made live with the Web
// Audio API, played on the "playback" audio session so iPhones may treat it like
// music (keep playing when locked, ignore the mute switch).

const $ = id => document.getElementById(id)
const log = msg => {
  const t = new Date().toLocaleTimeString('en-GB')
  $('log').textContent = `${t}  ${msg}\n` + $('log').textContent
}

const hasSession = 'audioSession' in navigator
$('support').textContent = hasSession ? `available (type now: ${navigator.audioSession.type})` : 'not available in this browser'
$('support').className = hasSession ? 'good' : 'bad'

let ctx = null
let gain = null
let source = null
let started = null     // { wall, audio } when play started
let away = null        // { wall, audio } when the page was hidden

// 30 s of brown noise whose end runs smoothly into its start, so the loop has no seam
function brownNoise(context) {
  const rate = context.sampleRate
  const n = rate * 30
  const fadeLen = rate          // 1 s crossfade at the seam
  const raw = new Float32Array(n + fadeLen)
  let last = 0
  for (let i = 0; i < raw.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    raw[i] = last * 3.5
  }
  const buffer = context.createBuffer(1, n, rate)
  const out = buffer.getChannelData(0)
  for (let i = 0; i < n; i++) {
    out[i] = i < fadeLen ? raw[i] * (i / fadeLen) + raw[n + i] * (1 - i / fadeLen) : raw[i]
  }
  return buffer
}

async function play() {
  if (hasSession && $('session').checked) {
    navigator.audioSession.type = 'playback'
    log(`audioSession.type set to "${navigator.audioSession.type}"`)
  }
  const c = ctx = new AudioContext()
  c.onstatechange = () => { log(`audio state: ${c.state}`); if (ctx === c) $('state').textContent = c.state }
  gain = ctx.createGain()
  gain.gain.value = Number($('volume').value)
  gain.connect(ctx.destination)
  source = ctx.createBufferSource()
  source.buffer = brownNoise(ctx)
  source.loop = true
  source.connect(gain)
  source.start()
  await ctx.resume()
  started = { wall: performance.now(), audio: ctx.currentTime }
  $('state').textContent = ctx.state
  $('toggle').textContent = 'Stop'
  $('fade').disabled = false
  log('playing')

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: 'Brown noise (lab)', artist: 'Deafening Silence' })
    navigator.mediaSession.playbackState = 'playing'
    navigator.mediaSession.setActionHandler('pause', () => { log('lock screen: pause'); stop() })
    navigator.mediaSession.setActionHandler('play', () => { log('lock screen: play'); ctx?.resume() })
  }
}

function stop() {
  if (!ctx) return
  source.stop()
  ctx.close()
  ctx = gain = source = started = away = null
  $('toggle').textContent = 'Play brown noise'
  $('fade').disabled = true
  $('state').textContent = 'stopped'
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none'
  log('stopped')
}

$('toggle').addEventListener('click', () => (ctx ? stop() : play().catch(e => log(`could not play: ${e.message}`))))

$('volume').addEventListener('input', e => {
  if (gain) gain.gain.setTargetAtTime(Number(e.target.value), ctx.currentTime, 0.05)
})

$('fade').addEventListener('click', () => {
  if (!ctx) return
  const now = ctx.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + 10)
  log('fading out over 10 s')
  setTimeout(stop, 10500)
})

// Did the audio clock keep running while the page was hidden (locked or another app)?
document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.hidden) {
    away = { wall: performance.now(), audio: ctx.currentTime }
    log('page hidden (locked or another app)')
    return
  }
  log(`page visible again, audio state: ${ctx.state}`)
  if (!away) return
  const wall = (performance.now() - away.wall) / 1000
  const audio = ctx.currentTime - away.audio
  const kept = audio >= wall * 0.95
  $('kept').textContent = kept
    ? `yes: played ${audio.toFixed(0)} s of ${wall.toFixed(0)} s away`
    : `no: played ${audio.toFixed(0)} s of ${wall.toFixed(0)} s away`
  $('kept').className = kept ? 'good' : 'bad'
  log(`away ${wall.toFixed(1)} s, audio advanced ${audio.toFixed(1)} s`)
  away = null
  if (ctx.state !== 'running') ctx.resume().then(() => log('resumed'), e => log(`resume failed: ${e.message}`))
})

setInterval(() => {
  if (!ctx || !started) return
  $('played').textContent = `${(ctx.currentTime - started.audio).toFixed(0)} s (clock: ${((performance.now() - started.wall) / 1000).toFixed(0)} s)`
}, 500)
