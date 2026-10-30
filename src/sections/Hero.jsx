/* global __LATEST_POST__, __BOOK_COUNT__ */   // set in vite.config.js
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import PyreMark from '../components/PyreMark'
import { SHELL } from '../styles/shell'
import { SECTIONS } from '../lib/sections'
import { usePageMeta } from '../lib/usePageMeta'
import { createLoopPlayer } from '../audio/loopPlayer'

const post = __LATEST_POST__

function formatDate(dateStr, lang) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(lang.startsWith('no') ? 'nb-NO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Silence's row: the thumbnail is a real player for brown noise
function SilenceThumb() {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const [player] = useState(() => createLoopPlayer(id => setPlaying(id !== null)))
  useEffect(() => () => player.stop(), [player])

  const toggle = () => {
    if (playing) player.stop()
    else player.play('brown', t('silence.sounds.brown')).catch(() => setPlaying(false))
  }

  return (
    <button type="button" className="thumb thumb-play" onClick={toggle} aria-pressed={playing}
      aria-label={t(playing ? 'hero.pauseSound' : 'hero.playSound')}>
      <img src="/images/silence/hills-sm.webp" alt="" width={288} height={360} />
      <span className="thumb-play-ov">
        <span className={`eq${playing ? ' on' : ''}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className="thumb-play-label" aria-hidden="true">
          {playing
            ? <><svg width="9" height="9" viewBox="0 0 12 12"><rect x="1" y="1" width="3.5" height="10" rx="1" /><rect x="7.5" y="1" width="3.5" height="10" rx="1" /></svg>{t('hero.pause')}</>
            : <><svg width="9" height="9" viewBox="0 0 12 12"><path d="M3 1.5v9l7.5-4.5z" /></svg>{t('hero.play')}</>}
        </span>
      </span>
    </button>
  )
}

function RowSub({ sectionKey }) {
  const { t, i18n } = useTranslation()
  if (sectionKey === 'writing' && post) {
    return (
      <span className="r-sub">
        <b>{t('hero.latestLabel')}</b>
        <span className="r-post">{post.title}</span>
        <span className="r-date">{formatDate(post.date, i18n.language)} <span className="r-lang">{post.language.toUpperCase()}</span></span>
      </span>
    )
  }
  return (
    <span className="r-sub">
      <b>{sectionKey === 'shelf' ? t('hero.books', { count: __BOOK_COUNT__ }) : t(`hero.teasers.${sectionKey}.title`)}</b>
      {t(`hero.teasers.${sectionKey}.desc`)}
    </span>
  )
}

function RowThumb({ sectionKey }) {
  const { t } = useTranslation()
  if (sectionKey === 'silence') return <SilenceThumb />
  const img = {
    writing: post?.thumbnail && { src: post.thumbnail, alt: post.thumbnailAlt },
    shelf:   { src: '/images/shelf/shelf-sm.webp', alt: t('hero.shelfAlt') },
    about:   { src: '/images/about/nithun-flower-field-sm.webp', alt: t('about.flowerAlt') },
  }[sectionKey]
  if (!img) return <span />
  return <span className="thumb"><img src={img.src} alt={img.alt} width={288} height={360} loading="lazy" /></span>
}

export default function Hero() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.homeTitle'), description: t('meta.homeDescription'), path: '/' })

  return (
    <div style={SHELL}>
      <h1 className="display home-name">
        <span className="l"><span>Nithun</span></span>
        <span className="l l2"><span>Manoharan</span></span>
      </h1>

      <div className="stand enter">
        <p className="stand-meta">
          <a href="https://pyre.no" target="_blank" rel="noopener noreferrer"><PyreMark size={12} />{t('hero.pyreBadge')}</a><br />
          {t('hero.role1')}<br />{t('hero.role2')}<br />{t('hero.location')}
        </p>
        <p className="stand-intro">{t('hero.intro')}</p>
        <img className="stand-head" src="/images/about/nithun-headshot-sm.webp" alt={t('about.headshotAlt')}
          width={324} height={387} fetchPriority="high" />
      </div>

      <nav aria-label={t('nav.sections')}>
        <ol className="contents">
          {SECTIONS.map(({ key, num, path, accent, fill }) => (
            <li key={key} className="row" style={{ '--c': accent, '--f': fill }}>
              <Link to={path} className="row-link">
                <span className="r-num" aria-hidden="true">{num}</span>
                <span className="r-text">
                  <span className="r-title">{t(`nav.${key}`)}</span>
                  <RowSub sectionKey={key} />
                </span>
                <span className="r-go" aria-hidden="true">→</span>
              </Link>
              <RowThumb sectionKey={key} />
            </li>
          ))}
        </ol>
      </nav>

      <p className="donate">
        <Trans
          i18nKey="hero.donate"
          components={[
            <a href="https://www.rodekors.no/"        className="text-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://legerutengrenser.no/"     className="text-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.spire.no/"            className="text-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.utviklingsfondet.no/" className="text-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.givewell.org/"        className="text-link" target="_blank" rel="noopener noreferrer" />,
            <Link to="/silence"                        className="text-link" />,
          ]}
        />
      </p>
    </div>
  )
}
