import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { createNoiseEngine } from '../audio/noiseEngine'
import charitiesData from '../data/charities.json'

const SOUND_TYPES = [
  { id: 'brown', icon: '▬' },
  { id: 'pink',  icon: '≈' },
  { id: 'rain',  icon: '·' },
  { id: 'ocean', icon: '∿' },
]
const TIMER_OPTIONS = [null, 30, 60, 90]
const charities = charitiesData.list

// Radial gradient tints per sound card — applied on hover / playing
const CARD_GRADIENTS = {
  brown: 'radial-gradient(ellipse at 30% 30%, color-mix(in oklch, var(--stone) 15%, transparent), transparent 65%)',
  pink:  'radial-gradient(ellipse at 70% 30%, color-mix(in oklch, var(--wheat) 12%, transparent), transparent 65%)',
  rain:  'radial-gradient(ellipse at 30% 70%, color-mix(in oklch, var(--dusty) 12%, transparent), transparent 65%)',
  ocean: 'radial-gradient(ellipse at 70% 70%, color-mix(in oklch, var(--sage)  10%, transparent), transparent 65%)',
}

function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 'calc(780px + 160px)',
  margin: '0 auto',
}

export default function SilencePage() {
  const { t } = useTranslation()
  const engineRef = useRef(null)
  const wakeLockRef = useRef(null)

  const [playing, setPlaying] = useState(null)   // sound id currently playing, or null
  const [volume, setVolume] = useState(0.35)
  const [timerMinutes, setTimerMinutes] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [audioError, setAudioError] = useState(false)

  function getEngine() {
    if (!engineRef.current) engineRef.current = createNoiseEngine()
    return engineRef.current
  }

  // ─── Wake lock ──────────────────────────────────────────────
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return
    try { wakeLockRef.current = await navigator.wakeLock.request('screen') } catch (_) {}
  }
  function releaseWakeLock() {
    if (wakeLockRef.current) { wakeLockRef.current.release().catch(() => {}); wakeLockRef.current = null }
  }

  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        engineRef.current?.resumeIfSuspended()
        if (playing && !wakeLockRef.current) await acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [playing])

  useEffect(() => {
    return () => { engineRef.current?.stop(); engineRef.current = null; releaseWakeLock() }
  }, [])

  // ─── Playback ───────────────────────────────────────────────
  const startSound = useCallback((id) => {
    const engine = getEngine()
    engine.play(id, () => setAudioError(true))
    engine.setVolume(volume)
    setPlaying(id)
    setAudioError(false)
    acquireWakeLock()

    if (timerMinutes) {
      engine.setSleepTimer(
        timerMinutes,
        (remaining) => setTimerRemaining(remaining),
        () => { setPlaying(null); setTimerRemaining(null); releaseWakeLock() }
      )
    }
  }, [volume, timerMinutes])

  const handleCardClick = useCallback((id) => {
    if (playing === id) {
      // pause
      getEngine().pause()
      setPlaying(null)
      setTimerRemaining(null)
      setAudioError(false)
      releaseWakeLock()
    } else {
      startSound(id)
    }
  }, [playing, startSound])

  const handleVolumeChange = useCallback((e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    engineRef.current?.setVolume(vol)
  }, [])

  const handleTimerSelect = useCallback((mins) => {
    setTimerMinutes(mins)
    if (!mins && timerRemaining !== null) {
      getEngine().cancelSleepTimer()
      setTimerRemaining(null)
    }
  }, [timerRemaining])

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="page-enter" style={SHELL}>
      <div style={{ padding: '64px 0 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 6 }}>
            {t('silence.heading')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--fgm)', letterSpacing: '0.03em', maxWidth: 500 }}>
            {t('silence.subtitle')}
          </p>
        </div>

        {/* Sound card grid */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 640, marginBottom: 48 }}
          className="max-[480px]:grid-cols-1"
        >
          {SOUND_TYPES.map(({ id, icon }) => {
            const isPlaying = playing === id
            return (
              <button
                key={id}
                onClick={() => handleCardClick(id)}
                aria-pressed={isPlaying}
                aria-label={`${t(`silence.sounds.${id}`)}${isPlaying ? ' — ' + t('silence.pause') : ''}`}
                style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${isPlaying ? 'color-mix(in oklch, var(--sage) 50%, transparent)' : 'color-mix(in oklch, var(--fg) 7%, transparent)'}`,
                  borderRadius: 4,
                  padding: '32px 28px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 140,
                  justifyContent: 'flex-end',
                  textAlign: 'left',
                  transition: 'border-color 0.25s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.querySelector('.card-gradient').style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!isPlaying) e.currentTarget.querySelector('.card-gradient').style.opacity = '0' }}
              >
                {/* Radial gradient tint */}
                <div
                  className="card-gradient"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 4,
                    background: CARD_GRADIENTS[id],
                    opacity: isPlaying ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />
                {/* Icon */}
                <span style={{ position: 'absolute', top: 24, right: 24, fontSize: 20, color: 'var(--fg)', opacity: 0.35 }} aria-hidden="true">
                  {icon}
                </span>
                {/* Name */}
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: 'var(--fg)', fontWeight: 'normal', position: 'relative' }}>
                  {t(`silence.sounds.${id}`)}
                </span>
                {/* Description or playing bars */}
                {isPlaying ? (
                  <div className="flex items-end gap-1" style={{ height: 14, position: 'relative' }} aria-hidden="true">
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--fgm)', letterSpacing: '0.04em', lineHeight: 1.5, position: 'relative' }}>
                    {t(`silence.soundDescriptions.${id}`)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Audio error */}
        {audioError && (
          <div
            role="alert"
            style={{
              maxWidth: 400,
              marginBottom: 24,
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--dusty) 8%, var(--bg2))',
              border: '1px solid color-mix(in oklch, var(--dusty) 30%, transparent)',
              borderRadius: 4,
              fontSize: 13,
              color: 'var(--fg2)',
            }}
          >
            {t('silence.audioError')}
          </div>
        )}

        {/* Controls panel */}
        <div
          style={{
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            padding: 32,
            background: 'var(--bg2)',
            borderRadius: 4,
            border: '1px solid color-mix(in oklch, var(--fg) 7%, transparent)',
            marginBottom: 48,
          }}
        >
          {/* Volume */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fgm)', marginBottom: 12 }}>
              {t('silence.volume')} — {Math.round(volume * 100)}%
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="vol-slider"
              aria-label={t('silence.volume')}
            />
          </div>

          {/* Sleep timer */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fgm)', marginBottom: 12 }}>
              {t('silence.sleepTimer')}
            </div>
            <div className="flex flex-wrap gap-2">
              {TIMER_OPTIONS.map(mins => (
                <button
                  key={String(mins)}
                  onClick={() => handleTimerSelect(mins)}
                  aria-pressed={timerMinutes === mins}
                  style={{
                    fontSize: 12,
                    color: timerMinutes === mins ? 'var(--fg)' : 'var(--fgm)',
                    background: 'none',
                    border: `1px solid ${timerMinutes === mins ? 'color-mix(in oklch, var(--fg) 35%, transparent)' : 'color-mix(in oklch, var(--fgm) 30%, transparent)'}`,
                    borderRadius: 2,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {mins === null ? t('silence.timerOff') : t('silence.timerMinutes', { minutes: mins })}
                </button>
              ))}
            </div>

            {timerRemaining !== null && (
              <div className="flex items-center gap-3 mt-3" role="status" aria-live="polite">
                <span style={{ fontSize: 13, color: 'var(--fgm)' }}>
                  {t('silence.timerActive', { remaining: formatRemaining(timerRemaining) })}
                </span>
                <button
                  onClick={() => { getEngine().cancelSleepTimer(); setTimerRemaining(null) }}
                  style={{ fontSize: 12, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  {t('silence.cancelTimer')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TRT guidance */}
        <div
          style={{
            maxWidth: 500,
            padding: '20px 24px',
            background: 'color-mix(in oklch, var(--olive) 6%, var(--bg2))',
            border: '1px solid color-mix(in oklch, var(--olive) 22%, transparent)',
            borderRadius: 4,
            marginBottom: 48,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--fgm)', lineHeight: 1.65 }}>
            {t('silence.guidance')}
          </p>
        </div>

        {/* Charities */}
        <div
          style={{
            maxWidth: 500,
            padding: '28px 32px',
            background: 'color-mix(in oklch, var(--olive) 8%, var(--bg2))',
            border: '1px solid color-mix(in oklch, var(--olive) 25%, transparent)',
            borderRadius: 4,
          }}
        >
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'normal', color: 'var(--fg2)', marginBottom: 8 }}>
            {t('silence.donationHeading')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--fgm)', lineHeight: 1.65, marginBottom: 16 }}>
            {t('silence.donationIntro')}
          </p>
          <ul className="list-none p-0 m-0 space-y-2">
            {charities.map(charity => (
              <li key={charity.id}>
                <a
                  href={charity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, letterSpacing: '0.07em', color: 'var(--sage)', textDecoration: 'none', borderBottom: '1px solid color-mix(in oklch, var(--sage) 40%, transparent)', paddingBottom: 1, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'color-mix(in oklch, var(--sage) 150%, white 20%)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--sage)'}
                >
                  {charity.name}
                </a>
                <span style={{ fontSize: 11, color: 'var(--fgm)', marginLeft: 8 }}>{charity.country}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
