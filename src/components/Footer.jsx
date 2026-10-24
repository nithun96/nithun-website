/* global __BUILD_DATE__ */   // set in vite.config.js
import { useTranslation } from 'react-i18next'
import PyreMark from './PyreMark'
import { SHELL } from '../styles/shell'

// Noon, so no time zone can move it to another day
const buildDate = new Date(`${__BUILD_DATE__}T12:00:00`)

export default function Footer() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('no') ? 'nb-NO' : 'en-GB'

  return (
    <footer style={{ borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)' }}>
      <div
        className="flex items-center justify-between flex-wrap gap-3"
        style={{ ...SHELL, padding: '32px clamp(24px, 5vw, 80px)' }}
      >
        <span style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em' }}>
          {t('footer.lastUpdated')} {buildDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-5">
          <a
            href="https://pyre.no"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', textDecoration: 'none', transition: 'color 0.2s ease', padding: '5px 0' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
          >
            <PyreMark size={11} />
            Pyre
          </a>
          <a
            href="https://github.com/nithun96"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', textDecoration: 'none', transition: 'color 0.2s ease', padding: '5px 0' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
          >
            GitHub
          </a>
          <a
            href="/rss.xml"
            type="application/rss+xml"
            style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', textDecoration: 'none', transition: 'color 0.2s ease', padding: '5px 0' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
          >
            {t('footer.rss')}
          </a>
<span style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em' }}>
            {t('footer.license')}
          </span>
        </div>
      </div>
    </footer>
  )
}
