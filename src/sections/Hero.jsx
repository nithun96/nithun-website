import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import PyreMark from '../components/PyreMark'
import { SHELL } from '../styles/shell'

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
        <div className="hero-top-row">
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
            <a
              href="https://pyre.no"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'inherit',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
            >
              <PyreMark size={12} />
              {t('hero.pyreBadge')}
            </a>
            <span aria-hidden="true">·</span>
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
        </div>

        {/* Small photo collage — a personal, creative touch */}
        <div className="hero-collage" aria-hidden="false">
          <img
            className="hero-collage-photo hero-collage-1"
            src="/images/about/nithun-portrait.webp"
            alt={t('about.portraitAlt')}
            width={900}
            height={1200}
            loading="lazy"
          />
          <img
            className="hero-collage-photo hero-collage-2"
            src="/images/about/photo-inari-fox.webp"
            alt={t('about.photoInariAlt')}
            width={1000}
            height={1333}
            loading="lazy"
          />
          <img
            className="hero-collage-photo hero-collage-3"
            src="/images/about/photo-riga-cathedral.webp"
            alt={t('about.photoRigaAlt')}
            width={1000}
            height={1333}
            loading="lazy"
          />
        </div>
        </div>
      </div>

      {/* ── Section teasers ───────────────────────────────────── */}
      <div className="hero-teasers" id="section-teasers">
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
      {/* ── Donate nudge ──────────────────────────────────────── */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
        paddingBottom: 64,
      }}>
        <p style={{ fontSize: 13, color: 'var(--fgm)', fontWeight: 300, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
        <Trans
          i18nKey="hero.donate"
          components={[
            <a href="https://www.rodekors.no/"        className="hero-donate-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://legerutengrenser.no/"     className="hero-donate-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.spire.no/"            className="hero-donate-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.utviklingsfondet.no/" className="hero-donate-link" target="_blank" rel="noopener noreferrer" />,
            <a href="https://www.givewell.org/"        className="hero-donate-link" target="_blank" rel="noopener noreferrer" />,
            <Link to="/silence"                        className="hero-donate-link" />,
          ]}
        />
        </p>
      </div>
    </div>
  )
}
