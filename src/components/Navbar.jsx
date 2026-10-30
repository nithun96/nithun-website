import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { SHELL } from '../styles/shell'
import { SECTIONS } from '../lib/sections'

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

// Top bar on every page: wordmark, the four sections (each marked in its own
// colour, underlined when you're in it), language and theme. On phones the
// section links move to a second row.
export default function Navbar() {
  const { t } = useTranslation()

  return (
    <header className="topbar" style={SHELL}>
      <div className="topbar-row">
        <Link to="/" className="mark" viewTransition><span className="mark-dot" aria-hidden="true" />Nithun</Link>
        <nav className="sections" aria-label={t('nav.mainNav')}>
          <ul>
            {SECTIONS.map(({ key, path, accent }) => (
              <li key={key}>
                <NavLink to={path} className="section-link" style={{ '--c': accent }} viewTransition>
                  <span className="section-dot" aria-hidden="true" />{t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="pills">
          <LangPill />
          <ThemePill />
        </div>
      </div>
    </header>
  )
}
