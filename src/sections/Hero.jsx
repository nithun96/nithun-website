import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 'calc(780px + 160px)',
  margin: '0 auto',
}

const SECTION_TEASERS = [
  { key: 'writing', path: '/writing', cls: 'writing', accent: 'var(--dusty)' },
  { key: 'silence', path: '/silence', cls: 'silence', accent: 'var(--sage)'  },
  { key: 'shelf',   path: '/shelf',   cls: 'shelf',   accent: 'var(--honey)' },
]

export default function Hero() {
  const { t } = useTranslation()

  return (
    <div className="page-enter" style={SHELL}>
      {/* ── Hero grid ─────────────────────────────────────────── */}
      <div className="hero-grid">
        {/* Text column */}
        <div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 'normal',
              color: 'var(--fg)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              marginBottom: 10,
            }}
          >
            {t('hero.name')}
          </h1>

          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--fgm)',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--fgm)', flexShrink: 0 }} />
            {t('hero.location')}
          </p>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: 'var(--fg2)',
              maxWidth: 560,
              marginBottom: 24,
              fontWeight: 300,
            }}
          >
            {t('hero.intro')}
          </p>

          <blockquote
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 15,
              fontStyle: 'italic',
              color: 'var(--fgm)',
              borderLeft: '2px solid color-mix(in oklch, var(--stone) 50%, transparent)',
              paddingLeft: 16,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: 0,
            }}
          >
            {t('hero.teaser')}
          </blockquote>
        </div>

      </div>

      {/* ── Section teasers ───────────────────────────────────── */}
      <div className="hero-teasers">
        {SECTION_TEASERS.map(({ key, path, accent }, i) => (
          <Link
            key={key}
            to={path}
            style={{
              padding: '28px 24px 28px 0',
              borderRight: i < 2 ? '1px solid color-mix(in oklch, var(--fg) 8%, transparent)' : 'none',
              paddingLeft: i > 0 ? 24 : 0,
              textDecoration: 'none',
              display: 'block',
              transition: 'background 0.2s ease',
            }}
            className="group"
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: accent,
                marginBottom: 10,
                display: 'inline-block',
              }}
            >
              {t(`hero.teasers.${key}.label`)}
            </span>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17,
                color: 'var(--fg2)',
                lineHeight: 1.4,
                marginBottom: 8,
                transition: 'color 0.2s ease',
              }}
              className="group-hover:text-fg"
            >
              {t(`hero.teasers.${key}.title`)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fgm)', lineHeight: 1.55 }}>
              {t(`hero.teasers.${key}.desc`)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
