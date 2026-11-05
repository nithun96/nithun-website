import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../lib/usePageMeta'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  // Nginx serves index.html for every path, so unknown URLs return 200.
  // noindex stops Google from indexing them as copies of the site.
  usePageMeta({ title: t('meta.notFoundTitle'), description: t('meta.homeDescription'), path: pathname, noindex: true })

  return (
    <div className="page-enter shell">
      <div className="nf">
      <h1>{t('notFound.heading')}</h1>
      <p>{t('notFound.body')}</p>
      <Link to="/" viewTransition className="nf-back">
        ← {t('notFound.home')}
      </Link>
      </div>
    </div>
  )
}
