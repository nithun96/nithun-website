import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

function ThemePill() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label={t('nav.toggleTheme')}
      style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--fgm)', borderColor: 'color-mix(in oklch, var(--fg) 18%, transparent)' }}
      className="border rounded-sm px-2 py-1 cursor-pointer transition-colors duration-200 hover:text-fg"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 35%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 18%, transparent)'}
    >
      {dark ? '☀' : '◐'}
    </button>
  )
}

function LangPill() {
  const { i18n, t } = useTranslation()
  const toggle = () => {
    const next = i18n.language.startsWith('no') ? 'en' : 'no'
    i18n.changeLanguage(next)
    document.documentElement.lang = next
  }
  return (
    <button
      onClick={toggle}
      aria-label={t('nav.toggleLang')}
      style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--fgm)', borderColor: 'color-mix(in oklch, var(--fg) 18%, transparent)' }}
      className="border rounded-sm px-2 py-1 cursor-pointer transition-colors duration-200 hover:text-fg"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 35%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 18%, transparent)'}
    >
      {i18n.language.startsWith('no') ? 'EN' : 'NO'}
    </button>
  )
}

const NAV_SECTIONS = [
  { key: 'writing', path: '/writing', accent: 'var(--dusty)' },
  { key: 'silence', path: '/silence', accent: 'var(--sage)'  },
  { key: 'shelf',   path: '/shelf',   accent: 'var(--honey)' },
]

export default function Navbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 flex items-center justify-between h-14"
      style={{
        padding: '0 clamp(24px, 5vw, 80px)',
        background: 'var(--bg)',
        borderBottom: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
        transition: 'background 0.2s ease',
      }}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1 focus:bg-bg2 focus:text-fg focus:rounded text-xs">
        Skip to content
      </a>

      <Link
        to="/"
        style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: 'var(--fg2)', letterSpacing: '0.02em', textDecoration: 'none', transition: 'color 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg2)'}
      >
        NM
      </Link>

      <ul className="flex items-center gap-8 list-none m-0 p-0">
        {NAV_SECTIONS.map(({ key, path, accent }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')
          return (
            <li key={key}>
              <Link
                to={path}
                className={`nav-link${isActive ? ' active' : ''}`}
                style={{ '--link-accent': accent }}
              >
                {t(`nav.${key}`)}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-4">
        <LangPill />
        <ThemePill />
      </div>
    </nav>
  )
}
