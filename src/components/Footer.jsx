import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer
      className="flex items-center justify-between flex-wrap gap-3"
      style={{
        borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
        padding: '32px clamp(24px, 5vw, 80px)',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em' }}>
        {t('footer.lastUpdated')} {__BUILD_DATE__}
      </span>
      <div className="flex items-center gap-5">
        <a
          href="https://github.com/nithun96"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', textDecoration: 'none', transition: 'color 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
        >
          GitHub
        </a>
        <span style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em' }}>
          {t('footer.license')}
        </span>
      </div>
    </footer>
  )
}
