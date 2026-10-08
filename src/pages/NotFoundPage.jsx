import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SHELL } from '../styles/shell'
import { usePageMeta } from '../lib/usePageMeta'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  // Nginx serves index.html for every path, so unknown URLs return 200.
  // noindex stops Google from indexing them as copies of the site.
  usePageMeta({ title: t('meta.notFoundTitle'), description: t('meta.homeDescription'), path: pathname, noindex: true })

  return (
    <div className="page-enter" style={SHELL}>
      <div style={{ padding: '96px 0 120px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 12 }}>
        {t('notFound.heading')}
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--fg2)', fontWeight: 300, marginBottom: 32 }}>
        {t('notFound.body')}
      </p>
      <Link
        to="/"
        style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fgm)', textDecoration: 'none', transition: 'color 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
      >
        ← {t('notFound.home')}
      </Link>
      </div>
    </div>
  )
}
