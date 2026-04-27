// SPDX-License-Identifier: AGPL-3.0-only
// Deafening Silence — noise engine
// This module is licensed under the GNU Affero General Public License v3.0.
// See LICENSE-silence at the repository root.
//
// Intended to be framework-agnostic so it can be extracted into a
// standalone Capacitor mobile app without modification.

// ── Rain layer mix gains — change these to re-balance the blend ──────────────
const RAIN_BODY_GAIN   = 0.50  // Layer 1: bandpass white noise  (steady wash)
const RAIN_RUMBLE_GAIN = 0.20  // Layer 2: lowpass brown noise   (surface rumble)
const RAIN_DROP_GAIN   = 0.30  // Layer 3: highpass pink noise   (drop texture)

// ── Layer 3 modulation — change these to reshape the patter feel ─────────────
const DROP_SLOW_LFO_FREQ   = 0.20    // Hz  — slow swelling rhythm
const DROP_SLOW_LFO_DEPTH  = 0.06    // gain units — depth of slow swell
const DROP_FAST_LFO_FREQ   = 2.00    // Hz  — faster drop-patter rate
const DROP_FAST_LFO_DEPTH  = 0.04    // gain units — depth of fast patter
const DROP_SPIKE_PROB      = 0.00003 // per-sample probability of a drop impulse
const DROP_SPIKE_PEAK      = 0.15    // maximum gain boost from a single spike
const DROP_SPIKE_DECAY     = 0.9997  // per-sample exponential decay of spike

// ── Note on ScriptProcessorNode ──────────────────────────────────────────────
// ScriptProcessorNode is deprecated in favour of AudioWorklet. It is used here
// because AudioWorklet requires a separate registered module file, which adds
// meaningful complexity with Vite's module system. Replace with AudioWorklet
// when moving to the Capacitor app if background-thread performance matters.

// ── Noise generator factories ────────────────────────────────────────────────
// Each factory closes over its own filter state, so multiple instances running
// simultaneously (as in rain's three-layer mix) cannot corrupt each other.

function makeWhiteNode(ctx) {
  const node = ctx.createScriptProcessor(4096, 1, 1)
  node.onaudioprocess = (e) => {
    const out = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1
  }
  return node
}

function makePinkNode(ctx) {
  // Paul Kellet IIR filter — real-time approximation of 1/f (pink) spectrum.
  // State is local to each instance so concurrent uses do not interfere.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  const node = ctx.createScriptProcessor(4096, 1, 1)
  node.onaudioprocess = (e) => {
    const out = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < out.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  return node
}

function makeBrownNode(ctx) {
  // Leaky integrator: integrates white noise with a small leak to prevent
  // DC drift. State is local to each instance.
  let last = 0
  const node = ctx.createScriptProcessor(4096, 1, 1)
  node.onaudioprocess = (e) => {
    const out = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < out.length; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      out[i] = last * 3.5
    }
  }
  return node
}

// ── Rain synthesis ────────────────────────────────────────────────────────────

function buildRainNodes(ctx, masterGain) {
  const nodes = []  // every node created here goes into this list for clean teardown

  // ─ Layer 1: Base rain body ───────────────────────────────────────────────
  // White noise → BPF (1500 Hz, Q 2) → gain(RAIN_BODY_GAIN) → master
  const bodySource = makeWhiteNode(ctx)
  const bodyFilter = ctx.createBiquadFilter()
  bodyFilter.type = 'bandpass'
  bodyFilter.frequency.value = 1500
  bodyFilter.Q.value = 2.0
  const bodyGain = ctx.createGain()
  bodyGain.gain.value = RAIN_BODY_GAIN
  bodySource.connect(bodyFilter)
  bodyFilter.connect(bodyGain)
  bodyGain.connect(masterGain)
  nodes.push(bodySource, bodyFilter, bodyGain)

  // ─ Layer 2: Low rumble ───────────────────────────────────────────────────
  // Brown noise → LPF (150 Hz) → gain(RAIN_RUMBLE_GAIN) → master
  const rumbleSource = makeBrownNode(ctx)
  const rumbleFilter = ctx.createBiquadFilter()
  rumbleFilter.type = 'lowpass'
  rumbleFilter.frequency.value = 150
  rumbleFilter.Q.value = 0.5
  const rumbleGain = ctx.createGain()
  rumbleGain.gain.value = RAIN_RUMBLE_GAIN
  rumbleSource.connect(rumbleFilter)
  rumbleFilter.connect(rumbleGain)
  rumbleGain.connect(masterGain)
  nodes.push(rumbleSource, rumbleFilter, rumbleGain)

  // ─ Layer 3: Drop texture ─────────────────────────────────────────────────
  // Pink noise → HPF (2500 Hz) → LFO-modulated gain → master
  //
  // Three modulators are summed into dropGain.gain (Web Audio API adds audio-rate
  // signals to the AudioParam's .value):
  //   • Slow LFO  — gentle overall swell
  //   • Fast LFO  — faster drop-patter rhythm
  //   • Spike gen — rare random impulses simulating individual drops
  //
  // Base gain RAIN_DROP_GAIN = 0.30; LFO depths are small enough that gain
  // stays positive (minimum ≈ 0.30 − 0.06 − 0.04 = 0.20).

  const dropSource = makePinkNode(ctx)
  const dropFilter = ctx.createBiquadFilter()
  dropFilter.type = 'highpass'
  dropFilter.frequency.value = 2500
  dropFilter.Q.value = 0.7

  const dropGain = ctx.createGain()
  dropGain.gain.value = RAIN_DROP_GAIN

  // Slow LFO (sine, DROP_SLOW_LFO_FREQ Hz)
  const slowLFO = ctx.createOscillator()
  slowLFO.type = 'sine'
  slowLFO.frequency.value = DROP_SLOW_LFO_FREQ
  const slowDepth = ctx.createGain()
  slowDepth.gain.value = DROP_SLOW_LFO_DEPTH
  slowLFO.connect(slowDepth)
  slowDepth.connect(dropGain.gain)
  slowLFO.start()
  nodes.push(slowLFO, slowDepth)

  // Fast LFO (sine, DROP_FAST_LFO_FREQ Hz)
  const fastLFO = ctx.createOscillator()
  fastLFO.type = 'sine'
  fastLFO.frequency.value = DROP_FAST_LFO_FREQ
  const fastDepth = ctx.createGain()
  fastDepth.gain.value = DROP_FAST_LFO_DEPTH
  fastLFO.connect(fastDepth)
  fastDepth.connect(dropGain.gain)
  fastLFO.start()
  nodes.push(fastLFO, fastDepth)

  // Irregular spike generator — ScriptProcessorNode outputting a non-negative
  // signal that is added to dropGain.gain at audio rate, creating the uneven
  // pattering of individual drops landing.
  let spikeEnv = 0
  const spikeNode = ctx.createScriptProcessor(4096, 1, 1)
  spikeNode.onaudioprocess = (e) => {
    const out = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < out.length; i++) {
      if (Math.random() < DROP_SPIKE_PROB) spikeEnv = Math.random() * DROP_SPIKE_PEAK
      spikeEnv *= DROP_SPIKE_DECAY
      out[i] = spikeEnv  // always ≥ 0, only adds to gain
    }
  }
  spikeNode.connect(dropGain.gain)
  nodes.push(spikeNode)

  dropSource.connect(dropFilter)
  dropFilter.connect(dropGain)
  dropGain.connect(masterGain)
  nodes.push(dropSource, dropFilter, dropGain)

  return nodes
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function createNoiseEngine() {
  let audioContext = null
  let gainNode = null
  let sourceNode = null  // single node for white / pink / brown
  let rainNodes  = []    // all nodes for the three-layer rain synthesis
  let currentType = null
  let isPlaying = false
  let userVolume = 0.35

  // Sleep timer state
  let sleepIntervalId = null
  let preFadeVolume = 0

  // ─── Context ────────────────────────────────────────────────────────────────

  function ensureContext() {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      gainNode = audioContext.createGain()
      gainNode.gain.value = userVolume
      gainNode.connect(audioContext.destination)
    }
  }

  async function resumeContext() {
    if (audioContext.state === 'suspended') await audioContext.resume()
  }

  // ─── Source management ──────────────────────────────────────────────────────

  function stopSource() {
    if (sourceNode) {
      try { sourceNode.disconnect() } catch (_) {}
      sourceNode = null
    }
    for (const node of rainNodes) {
      try { node.disconnect() } catch (_) {}
      try { if (typeof node.stop === 'function') node.stop() } catch (_) {}
    }
    rainNodes = []
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start playback. Stops any current source first.
   * @param {'white'|'pink'|'brown'|'rain'} type
   */
  async function play(type) {
    ensureContext()
    await resumeContext()
    stopSource()
    clearSleepTimer()
    currentType = type

    if (type === 'rain') {
      rainNodes = buildRainNodes(audioContext, gainNode)
    } else {
      const makers = { white: makeWhiteNode, pink: makePinkNode, brown: makeBrownNode }
      sourceNode = makers[type](audioContext)
      sourceNode.connect(gainNode)
    }

    gainNode.gain.value = userVolume
    isPlaying = true
  }

  /** Set master volume. Range 0–1. */
  function setVolume(vol) {
    userVolume = Math.max(0, Math.min(1, vol))
    if (gainNode) gainNode.gain.value = userVolume
  }

  /** Pause playback (keeps AudioContext alive for fast resume). */
  function pause() {
    clearSleepTimer()
    stopSource()
    isPlaying = false
  }

  /** Stop playback and release the AudioContext entirely. */
  function stop() {
    clearSleepTimer()
    stopSource()
    if (audioContext && audioContext.state !== 'closed') audioContext.close()
    audioContext = null
    gainNode = null
    isPlaying = false
    currentType = null
  }

  // ─── Sleep timer ────────────────────────────────────────────────────────────

  function clearSleepTimer() {
    if (sleepIntervalId !== null) {
      clearInterval(sleepIntervalId)
      sleepIntervalId = null
    }
    if (gainNode) gainNode.gain.value = userVolume
  }

  /**
   * Set a sleep timer that fades out and pauses after `minutes` minutes.
   * Linearly fades volume to zero over the final 60 seconds.
   *
   * @param {number}   minutes    - Duration (30 / 60 / 90)
   * @param {function} onTick     - Called every second with remaining ms
   * @param {function} onExpired  - Called when playback stops
   */
  function setSleepTimer(minutes, onTick, onExpired) {
    clearSleepTimer()
    if (!minutes || minutes <= 0) return

    const totalMs = minutes * 60 * 1000
    const FADE_MS = 60 * 1000
    const startedAt = Date.now()
    preFadeVolume = userVolume

    sleepIntervalId = setInterval(() => {
      const remaining = totalMs - (Date.now() - startedAt)
      if (onTick) onTick(Math.max(0, remaining))

      if (remaining <= FADE_MS && gainNode) {
        gainNode.gain.value = Math.max(0, preFadeVolume * (remaining / FADE_MS))
      }

      if (remaining <= 0) {
        clearInterval(sleepIntervalId)
        sleepIntervalId = null
        pause()
        userVolume = preFadeVolume
        if (gainNode) gainNode.gain.value = userVolume
        if (onExpired) onExpired()
      }
    }, 1000)
  }

  /** Cancel an active sleep timer without stopping playback. */
  function cancelSleepTimer() {
    clearSleepTimer()
  }

  function getIsPlaying()   { return isPlaying }
  function getCurrentType() { return currentType }

  return { play, setVolume, pause, stop, setSleepTimer, cancelSleepTimer, getIsPlaying, getCurrentType }
}
