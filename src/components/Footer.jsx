import { useTranslation } from 'react-i18next'
import { SHELL } from '../styles/shell'

const LINKS = [
  { label: 'LinkedIn',  href: 'https://no.linkedin.com/in/nithunm' },
  { label: 'GitHub',    href: 'https://github.com/nithun96' },
  { label: 'Instagram', href: 'https://www.instagram.com/nithunm' },
]

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer style={SHELL}>
      <div className="foot">
        <nav aria-label={t('footer.elsewhere')}>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          ))}
        </nav>
        <span>{t('footer.license')}</span>
      </div>
    </footer>
  )
}
