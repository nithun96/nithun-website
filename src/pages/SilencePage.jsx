import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createNoiseEngine } from '../audio/noiseEngine'
import charitiesData from '../data/charities.json'

const SOUND_TYPES = ['white', 'pink', 'brown', 'rain']
const TIMER_OPTIONS = [0, 30, 60, 90]
const charities = charitiesData.list

// ─── Icons ──────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SilencePage() {
  const { t } = useTranslation()
  const engineRef = useRef(null)
  const wakeLockRef = useRef(null)

  const [selectedSound, setSelectedSound] = useState('brown')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.35)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [audioError, setAudioError] = useState(false)

  function getEngine() {
    if (!engineRef.current) engineRef.current = createNoiseEngine()
    return engineRef.current
  }

  // ─── Wake lock ─────────────────────────────────────────────────────────────
  // Requests a screen wake lock when playback is active.
  // iOS Safari has known limitations with PWA background audio — the screen
  // can still lock and audio may pause. Proper background playback will require
  // Capacitor wrapping in the future mobile app.

  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch (_) {
      // Wake lock unavailable or denied — non-fatal, audio continues regardless
    }
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }

  // Resume the AudioContext when the page becomes visible again — iOS suspends
  // AudioContexts on backgrounding and they must be explicitly resumed.
  // Also re-acquire the wake lock if playback is still active.
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        engineRef.current?.resumeIfSuspended()
        if (isPlaying && !wakeLockRef.current) {
          await acquireWakeLock()
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isPlaying])

  // Stop and release everything on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      engineRef.current = null
      releaseWakeLock()
    }
  }, [])

  // ─── Playback control ──────────────────────────────────────────────────────
  // startEngine is synchronous so that engine.play() — which creates the
  // AudioContext, runs the iOS unlock pattern, and calls source.start() — all
  // happen within the same event-loop task as the originating user gesture.
  // iOS Safari requires this: any await before AudioContext use breaks the
  // gesture-activation window and results in silent playback.

  const startEngine = useCallback((type) => {
    const engine = getEngine()
    engine.play(type, () => setAudioError(true))
    engine.setVolume(volume)
    setIsPlaying(true)
    setAudioError(false)
    acquireWakeLock()  // async, but wake lock is not audio — safe to fire-and-forget

    if (timerMinutes > 0) {
      engine.setSleepTimer(
        timerMinutes,
        (remaining) => setTimerRemaining(remaining),
        () => {
          setIsPlaying(false)
          setTimerRemaining(null)
          releaseWakeLock()
        }
      )
    }
  }, [volume, timerMinutes])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      getEngine().pause()
      setIsPlaying(false)
      setTimerRemaining(null)
      setAudioError(false)
      releaseWakeLock()
    } else {
      startEngine(selectedSound)
    }
  }, [isPlaying, selectedSound, startEngine])

  const handleSoundSelect = useCallback((type) => {
    setSelectedSound(type)
    if (isPlaying) {
      startEngine(type)
    }
  }, [isPlaying, startEngine])

  const handleVolumeChange = useCallback((e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    engineRef.current?.setVolume(vol)
  }, [])

  const handleTimerSelect = useCallback((mins) => {
    setTimerMinutes(mins)
    if (mins === 0 && timerRemaining !== null) {
      getEngine().cancelSleepTimer()
      setTimerRemaining(null)
    }
  }, [timerRemaining])

  const handleCancelTimer = useCallback(() => {
    getEngine().cancelSleepTimer()
    setTimerRemaining(null)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        {t('silence.backHome')}
      </Link>

      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-4">
        {t('silence.heading')}
      </h1>

      <p className="text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 mb-8 max-w-xl">
        {t('silence.intro')}
      </p>

      {/* TRT guidance note */}
      <div className="mb-10 px-4 py-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 max-w-xl">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {t('silence.guidance')}
        </p>
      </div>

      {/* Sound type selector */}
      <fieldset className="mb-8">
        <legend className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
          {t('silence.soundType')}
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SOUND_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleSoundSelect(type)}
              aria-pressed={selectedSound === type}
              aria-label={`${t(`silence.sounds.${type}`)} — ${t(`silence.soundDescriptions.${type}`)}`}
              className={[
                'py-5 px-3 rounded-xl border-2 text-center transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                selectedSound === type
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500',
              ].join(' ')}
            >
              <span className={[
                'block font-serif font-semibold text-lg mb-1',
                selectedSound === type
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-zinc-800 dark:text-zinc-200',
              ].join(' ')}>
                {t(`silence.sounds.${type}`)}
              </span>
              <span className="block text-xs text-zinc-400 dark:text-zinc-500 leading-snug">
                {t(`silence.soundDescriptions.${type}`)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Play / pause */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? t('silence.pause') : t('silence.play')}
          className={[
            'w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
            'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white',
          ].join(' ')}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      {/* Audio error */}
      {audioError && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 max-w-sm mx-auto text-center"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('silence.audioError')}
          </p>
        </div>
      )}

      {/* Volume */}
      <div className="mb-8 max-w-sm">
        <label
          htmlFor="volume-slider"
          className="flex justify-between text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2"
        >
          <span>{t('silence.volume')}</span>
          <span>{Math.round(volume * 100)}%</span>
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full accent-amber-500"
        />
      </div>

      {/* Sleep timer */}
      <div className="mb-16">
        <fieldset>
          <legend className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            {t('silence.sleepTimer')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {TIMER_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => handleTimerSelect(mins)}
                aria-pressed={timerMinutes === mins}
                className={[
                  'px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                  timerMinutes === mins
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-700 dark:text-zinc-300',
                ].join(' ')}
              >
                {mins === 0
                  ? t('silence.timerOff')
                  : t('silence.timerMinutes', { minutes: mins })}
              </button>
            ))}
          </div>

          {timerRemaining !== null && (
            <div className="mt-3 flex items-center gap-3" role="status" aria-live="polite">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('silence.timerActive', { remaining: formatRemaining(timerRemaining) })}
              </span>
              <button
                onClick={handleCancelTimer}
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
              >
                {t('silence.cancelTimer')}
              </button>
            </div>
          )}
        </fieldset>
      </div>

      {/* Donation section */}
      <section aria-labelledby="donation-heading" className="border-t border-zinc-200 dark:border-zinc-700 pt-10">
        <h2
          id="donation-heading"
          className="font-serif font-semibold text-xl mb-3"
        >
          {t('silence.donationHeading')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 mb-6 max-w-xl">
          {t('silence.donationIntro')}
        </p>
        <ul className="space-y-4">
          {charities.map((charity) => (
            <li key={charity.id}>
              <a
                href={charity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-amber-400">
                  {charity.name}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500" aria-hidden="true">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">{charity.description}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">({charity.country})</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
