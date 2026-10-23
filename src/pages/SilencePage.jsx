import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { createLoopPlayer, canSetVolume } from '../audio/loopPlayer'
import charitiesData from '../data/charities.json'
import { SHELL } from '../styles/shell'
import { usePageMeta } from '../lib/usePageMeta'

const SOUNDS = ['brown', 'pink', 'rain', 'ocean']
const TIMER_OPTIONS = [null, 30, 60, 90]
const WIDTH = 560
const DEFAULT_VOLUME = 0.6   // computers and Android; iPhones use their volume buttons
const charities = charitiesData.list

// Tint on the card that is playing
const CARD_GRADIENTS = {
  brown: 'radial-gradient(ellipse at 30% 30%, color-mix(in oklch, var(--stone) 15%, transparent), transparent 65%)',
  pink:  'radial-gradient(ellipse at 70% 30%, color-mix(in oklch, var(--wheat) 12%, transparent), transparent 65%)',
  rain:  'radial-gradient(ellipse at 30% 70%, color-mix(in oklch, var(--dusty) 12%, transparent), transparent 65%)',
  ocean: 'radial-gradient(ellipse at 70% 70%, color-mix(in oklch, var(--sage)  10%, transparent), transparent 65%)',
}

const LABEL = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fgm)', marginBottom: 12 }
const MUTED = 'color-mix(in oklch, var(--fgm) 75%, var(--fg))'

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SilencePage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.silenceTitle'), description: t('meta.silenceDescription'), path: '/silence' })

  const [playing, setPlaying] = useState(null)   // sound id playing, or null
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [timerMinutes, setTimerMinutes] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [audioError, setAudioError] = useState(false)

  const [player] = useState(() => {
    const p = createLoopPlayer(setPlaying)
    p.setVolume(DEFAULT_VOLUME)
    return p
  })

  // Stop when leaving the page
  useEffect(() => () => player.stop(), [player])

  // Sleep timer countdown
  useEffect(() => {
    if (!playing || !timerMinutes) return
    const tick = () => {
      const at = player.stopsAt()
      setRemaining(at ? at - Date.now() : null)
    }
    const id = setInterval(tick, 1000)
    return () => { clearInterval(id); setRemaining(null) }
  }, [player, playing, timerMinutes])

  const handleCardClick = useCallback((id) => {
    setAudioError(false)
    if (playing === id) player.stop()
    else player.play(id, t(`silence.sounds.${id}`)).catch(() => setAudioError(true))
  }, [player, playing, t])

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    player.setVolume(v)
  }, [player])

  const handleTimerSelect = useCallback((mins) => {
    setTimerMinutes(mins)
    player.setTimer(mins)
  }, [player])

  return (
    <div className="page-enter" style={SHELL}>
      <div style={{ padding: '64px 0 80px' }}>

        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 6 }}>
            {t('silence.heading')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--fgm)', letterSpacing: '0.03em', maxWidth: WIDTH }}>
            {t('silence.subtitle')}
          </p>
        </div>

        {/* Sounds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: WIDTH, marginBottom: 40 }}>
          {SOUNDS.map(id => {
            const isPlaying = playing === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleCardClick(id)}
                aria-pressed={isPlaying}
                aria-label={`${t(`silence.sounds.${id}`)}${isPlaying ? ' — ' + t('silence.pause') : ''}`}
                style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${isPlaying ? 'color-mix(in oklch, var(--sage) 50%, transparent)' : 'color-mix(in oklch, var(--fg) 7%, transparent)'}`,
                  borderRadius: 4,
                  padding: '24px 24px 20px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  textAlign: 'left',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, background: CARD_GRADIENTS[id], opacity: isPlaying ? 1 : 0, pointerEvents: 'none' }}
                />
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: 'var(--fg)', position: 'relative' }}>
                  {t(`silence.sounds.${id}`)}
                </span>
                {/* Always 14px tall, so the card doesn't change size when it plays */}
                <span className="flex items-end gap-1" style={{ height: 14, position: 'relative' }} aria-hidden="true">
                  {isPlaying && <>
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                  </>}
                </span>
              </button>
            )
          })}
        </div>

        {audioError && (
          <p role="alert" style={{ fontSize: 13, color: 'var(--fg2)', maxWidth: WIDTH, marginBottom: 32 }}>
            {t('silence.audioError')}
          </p>
        )}

        {/* Volume: iPhones and iPads use their volume buttons instead */}
        {canSetVolume && (
          <div style={{ maxWidth: 320, marginBottom: 32 }}>
            <div style={LABEL}>{t('silence.volume')}</div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="vol-slider"
              aria-label={t('silence.volume')}
            />
          </div>
        )}

        {/* Sleep timer */}
        <div style={{ marginBottom: 64 }}>
          <div style={LABEL}>{t('silence.sleepTimer')}</div>
          <div className="flex flex-wrap gap-2">
            {TIMER_OPTIONS.map(mins => (
              <button
                key={String(mins)}
                type="button"
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
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {mins === null ? t('silence.timerOff') : t('silence.timerMinutes', { minutes: mins })}
              </button>
            ))}
          </div>
          {remaining !== null && (
            <p style={{ fontSize: 13, color: 'var(--fgm)', marginTop: 12 }}>
              {t('silence.timerActive', { remaining: formatRemaining(remaining) })}
            </p>
          )}
        </div>

        {/* Charities */}
        <div style={{ maxWidth: WIDTH }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 'normal', color: 'var(--fg2)', marginBottom: 8 }}>
            {t('silence.donationHeading')}
          </h2>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, marginBottom: 16 }}>
            {t('silence.donationIntro')}
          </p>
          <ul className="list-none p-0 m-0 space-y-2">
            {charities.map(charity => (
              <li key={charity.id}>
                <a
                  href={charity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, letterSpacing: '0.07em', color: 'color-mix(in oklch, var(--sage) 80%, var(--fg))', textDecoration: 'none', borderBottom: '1px solid color-mix(in oklch, var(--sage) 40%, transparent)', paddingBottom: 1 }}
                >
                  {charity.name}
                </a>
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{charity.country}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
