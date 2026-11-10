import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createNoisePlayer } from '../audio/noisePlayer'
import charitiesData from '../data/charities.json'
import { usePageMeta } from '../lib/usePageMeta'

const SOUNDS = ['brown', 'pink', 'rain', 'ocean']
const TIMER_OPTIONS = [null, 30, 60, 90]
// Full volume on iPhones and iPads, as before Nov 2026 (the old player couldn't change
// volume there, so people set it with the volume buttons); a gentler start elsewhere.
// iPads ask for desktop pages and say "Macintosh", but have a touch screen.
const isIos = typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
const DEFAULT_VOLUME = isIos ? 1 : 0.6
const charities = charitiesData.list
// Tinnitus UK's sound therapy leaflet (the basis for the volume tip in the guide)
const TINNITUS_UK_GUIDE = 'https://tinnitus.org.uk/wp-content/uploads/2024/08/Tinnitus-UK-Sound-Therapy-Leaflet.pdf'

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// A fixed, made-up shape per sound for the bars beside it (decoration only)
function waveHeights(id) {
  let seed = { brown: 3, pink: 11, rain: 29, ocean: 47 }[id]
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  return Array.from({ length: 28 }, (_, i) => {
    const t = i / 27
    const h = id === 'brown' ? 30 + 22 * Math.sin(t * 3.1 + 0.4) + 10 * rand()
      : id === 'pink' ? 40 + 18 * rand() + 8 * Math.sin(t * 9)
      : id === 'rain' ? 18 + 70 * Math.pow(rand(), 2.2)
      : 12 + 80 * Math.pow(Math.sin(Math.PI * t), 2) + 6 * rand()
    return { h: Math.round(Math.min(100, h)), d: (rand() * 0.9).toFixed(2) }
  })
}

const PlayIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
const PauseIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1" width="3.2" height="10" rx="1" /><rect x="7.3" y="1" width="3.2" height="10" rx="1" /></svg>

export default function SilencePage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.silenceTitle'), description: t('meta.silenceDescription'), path: '/silence' })

  const [playing, setPlaying] = useState(null)   // sound id playing, or null
  const [last, setLast] = useState(null)         // the last sound played, for the big button
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [timerMinutes, setTimerMinutes] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [audioError, setAudioError] = useState(false)
  const waves = useMemo(() => Object.fromEntries(SOUNDS.map(id => [id, waveHeights(id)])), [])

  const [player] = useState(() => {
    const p = createNoisePlayer(setPlaying)
    p.setVolume(DEFAULT_VOLUME)
    return p
  })

  // Stop when leaving the page
  useEffect(() => () => player.stop(), [player])

  // Save this page and the sounds played on it for offline use (src/sw.js)
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Sleep timer countdown
  useEffect(() => {
    if (!playing || !timerMinutes) return
    const tick = () => {
      const at = player.stopsAt()
      setRemaining(at ? at - Date.now() : null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => { clearInterval(id); setRemaining(null) }
  }, [player, playing, timerMinutes])

  const start = useCallback((id) => {
    setAudioError(false)
    setLast(id)
    player.play(id, t(`silence.sounds.${id}`)).catch(() => setAudioError(true))
  }, [player, t])

  const toggle = useCallback((id) => {
    if (playing === id) player.stop()
    else start(id)
  }, [player, playing, start])

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    player.setVolume(v)
  }, [player])

  const handleTimerSelect = useCallback((mins) => {
    setTimerMinutes(mins)
    player.setTimer(mins)
  }, [player])

  const name = id => t(`silence.sounds.${id}`)
  const lower = id => name(id).toLowerCase()
  const bigId = playing || last || 'brown'

  let nowPlaying = t('silence.nothingYet')
  if (playing) nowPlaying = name(playing)
  else if (last) nowPlaying = t('silence.paused', { sound: name(last) })

  let digits = t('silence.timerOff')
  if (timerMinutes) digits = formatRemaining(remaining ?? timerMinutes * 60000)

  return (
    <div className="page-enter">
      <div className="shell">
        <section className="s-hero">
          <div>
            <h1 className="display s-name" style={{ '--c': 'var(--sage)' }}>
              <span className="l"><span>{t('silence.headingA')}</span></span>{' '}
              <span className="l l2"><span>{t('silence.headingB')}</span></span>
            </h1>
            <p className="s-intro enter">{t('silence.intro')}</p>
          </div>
          <figure className="s-art enter">
            <img src="/images/silence/hills.webp" alt={t('silence.artAlt')} width={576} height={720} fetchPriority="high" />
            <figcaption>{t('silence.artCaption')}</figcaption>
          </figure>
        </section>

        <ol className="sounds" aria-label={t('silence.soundsLabel')}>
          {SOUNDS.map((id, i) => {
            const on = playing === id
            return (
              <li key={id}>
                <button type="button" className="snd" onClick={() => toggle(id)} aria-pressed={on} aria-label={name(id)}>
                  <span className="snd-num" aria-hidden="true">0{i + 1}</span>
                  <span className="snd-name" aria-hidden="true">{name(id)}</span>
                  <span className="snd-desc" aria-hidden="true">{t(`silence.desc.${id}`)}</span>
                  <span className={`wave wave-${id}`} aria-hidden="true">
                    {waves[id].map((b, j) => <i key={j} style={{ height: `${b.h}%`, animationDelay: `${b.d}s` }} />)}
                  </span>
                  <span className="snd-state" aria-hidden="true">
                    {on ? <><PauseIcon size={10} />{t('silence.pause')}</> : <><PlayIcon size={10} />{t('silence.play')}</>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <section className="player" aria-label={t('silence.playerLabel')}>
        <div className="player-grid shell">
          <div className="np">
            <span className="k">{t('silence.nowPlaying')}</span>
            <button type="button" className="big-play" onClick={() => toggle(bigId)}
              aria-label={t(playing ? 'silence.pauseSound' : 'silence.playSound', { sound: lower(bigId) })}>
              {playing ? <PauseIcon size={24} /> : <PlayIcon size={26} />}
            </button>
            <p className="np-name">{nowPlaying}</p>
          </div>
          <div>
            <span className="k" id="timer-label">{t('silence.sleepTimer')}</span>
            <p className="digits">{digits}</p>
            <div className="chips" role="group" aria-labelledby="timer-label">
              {TIMER_OPTIONS.map(mins => (
                <button key={String(mins)} type="button" className="chip" onClick={() => handleTimerSelect(mins)} aria-pressed={timerMinutes === mins}>
                  {mins === null ? t('silence.timerOff') : t('silence.timerMinutes', { minutes: mins })}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="k" htmlFor="silence-volume">{t('silence.volume')}</label>
            <input id="silence-volume" className="vol-slider" type="range" min="0" max="1" step="0.01"
              value={volume} onChange={handleVolumeChange} />
            {audioError && <p className="player-note" role="alert">{t('silence.audioError')}</p>}
          </div>
        </div>
      </section>

      <div className="shell">
        <section className="guide" aria-labelledby="guide-title">
          <div className="give-head">
            <h2 id="guide-title">{t('silence.guide.heading')}</h2>
            <p>{t('silence.guide.intro')}</p>
          </div>
          <ol className="tips">
            <li>
              <h3>{t('silence.guide.levelTitle')}</h3>
              <p>{t('silence.guide.level')}</p>
              <a className="text-link" href={TINNITUS_UK_GUIDE} target="_blank" rel="noopener noreferrer">{t('silence.guide.levelLink')}</a>
            </li>
            {['sleep', 'phone'].map(k => (
              <li key={k}>
                <h3>{t(`silence.guide.${k}Title`)}</h3>
                <p>{t(`silence.guide.${k}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="give" aria-labelledby="give-title">
          <div className="give-head">
            <h2 id="give-title">{t('silence.donationHeading')}</h2>
            <p>{t('silence.donationIntro')}</p>
          </div>
          <ul className="orgs">
            {charities.map(c => (
              <li key={c.id}>
                <a className="org" href={c.url} target="_blank" rel="noopener noreferrer">
                  <span className="org-code">{c.country}</span>
                  <span className="org-name">{c.name}</span>
                  <span className="org-desc">{t(`silence.charities.${c.id}`, { defaultValue: c.description })}</span>
                  <span className="org-go" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
