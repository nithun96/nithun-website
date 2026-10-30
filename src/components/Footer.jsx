/* global __BUILD_DATE__ */   // set in vite.config.js
import { useTranslation } from 'react-i18next'
import { SHELL } from '../styles/shell'

const LINKS = [
  { label: 'LinkedIn',  href: 'https://no.linkedin.com/in/nithunm' },
  { label: 'GitHub',    href: 'https://github.com/nithun96' },
  { label: 'Instagram', href: 'https://www.instagram.com/nithunm' },
]

// Noon, so no time zone can move it to another day
const buildDate = new Date(`${__BUILD_DATE__}T12:00:00`)

export default function Footer() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('no') ? 'nb-NO' : 'en-GB'

  return (
    <footer style={SHELL}>
      <div className="foot">
        <nav aria-label={t('footer.elsewhere')}>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          ))}
        </nav>
        <span>
          {t('footer.updated', { date: buildDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
          {' · '}{t('footer.license')}
        </span>
      </div>
    </footer>
  )
}
