/* global __BUILD_DATE__ */   // set in vite.config.js
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { SHELL } from '../styles/shell'
import { sectionFor } from '../lib/sections'

// Noon, so no time zone can move it to another day
const buildDate = new Date(`${__BUILD_DATE__}T12:00:00`)

function ThemePill() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1C1A17' : '#F5F0E8')
  }, [dark])

  return (
    <button type="button" className="pill" onClick={() => setDark(d => !d)} aria-label={t('nav.toggleTheme')}>
      {/* ︎ shows the sun as a plain symbol, not a yellow emoji, on iPhone */}
      {dark ? '☀︎' : '◐'}
    </button>
  )
}

function LangPill() {
  const { i18n, t } = useTranslation()
  const code = i18n.language.startsWith('no') ? 'EN' : 'NO'   // the language you switch to
  const toggle = () => {
    const next = i18n.language.startsWith('no') ? 'en' : 'no'
    i18n.changeLanguage(next)
    document.documentElement.lang = next
  }
  return (
    <button type="button" className="pill" onClick={toggle} aria-label={`${code}, ${t('nav.toggleLang')}`}>
      {code}
    </button>
  )
}

// Top bar on every page; below it on section pages, a breadcrumb back to the
// contents (the homepage), e.g. "Contents / 02 Silence".
export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const locale = i18n.language?.startsWith('no') ? 'nb-NO' : 'en-GB'
  const section = sectionFor(pathname)
  const deeper = section && pathname !== section.path   // e.g. a single post

  return (
    <header style={SHELL}>
      <div className="topbar">
        <Link to="/" className="mark"><span className="mark-dot" aria-hidden="true" />Nithun</Link>
        <span className="issue">
          {t('nav.updated', { date: buildDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
        </span>
        <div className="pills">
          <LangPill />
          <ThemePill />
        </div>
      </div>
      {section && (
        <nav className="crumb" aria-label={t('nav.breadcrumb')} style={{ '--c': section.accent }}>
          <Link to="/">{t('nav.contents')}</Link>
          <span aria-hidden="true">/</span>
          {deeper
            ? <Link to={section.path}><b>{section.num} {t(`nav.${section.key}`)}</b></Link>
            : <b aria-current="page">{section.num} {t(`nav.${section.key}`)}</b>}
        </nav>
      )}
    </header>
  )
}

