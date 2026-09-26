import { useTranslation } from 'react-i18next'
import { SHELL } from '../styles/shell'

const PHOTOS = [
  { file: 'photo-wroclaw-night.webp',      altKey: 'about.photoWroclawAlt', caption: 'Wrocław, Poland' },
  { file: 'photo-red-windows.webp',        altKey: 'about.photoRedWindowsAlt', caption: 'Copenhagen, Denmark' },
  { file: 'photo-heddal-church.webp',      altKey: 'about.photoHeddalAlt', caption: 'Heddal, Norway' },
  { file: 'photo-sunflare-building.webp',  altKey: 'about.photoSunflareAlt', caption: 'Stockholm, Sweden' },
  { file: 'photo-inari-fox.webp',          altKey: 'about.photoInariAlt', caption: 'Kyoto, Japan' },
  { file: 'photo-riga-cathedral.webp',     altKey: 'about.photoRigaAlt', caption: 'Riga, Latvia' },
]

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="page-enter" style={SHELL}>
      <div style={{ padding: '56px 0 0' }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fgm)',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--fgm)', flexShrink: 0 }} />
          {t('about.eyebrow')}
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 0 }}>
          {t('hero.name')}
        </h1>
      </div>

      {/* Portrait + secondary photo */}
      <div className="about-portraits" style={{ display: 'flex', gap: 20, marginTop: 32 }}>
        <img
          src="/images/about/nithun-portrait.webp"
          alt={t('about.portraitAlt')}
          width={900}
          height={1200}
          style={{ width: '58%', maxWidth: 320, borderRadius: 6, objectFit: 'cover', aspectRatio: '3/4' }}
        />
        <img
          src="/images/about/nithun-flower-field.webp"
          alt={t('about.flowerAlt')}
          width={900}
          height={1200}
          style={{ width: '42%', maxWidth: 220, borderRadius: 6, objectFit: 'cover', aspectRatio: '3/4', marginTop: 28 }}
        />
      </div>

      {/* Bio */}
      <div style={{ marginTop: 32, maxWidth: 620 }}>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--fg2)', fontWeight: 300, marginBottom: 16 }}>
          {t('about.bio1')}
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--fg2)', fontWeight: 300 }}>
          {t('about.bio2')}
        </p>
      </div>

      {/* Photography */}
      <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 8 }}>
          {t('about.photosHeading')}
        </h2>
        <p style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', marginBottom: 24 }}>
          {t('about.photosRights')}
        </p>
        <div className="about-photo-grid">
          {PHOTOS.map(({ file, altKey, caption }) => (
            <figure key={file} style={{ margin: 0 }}>
              <img
                src={`/images/about/${file}`}
                alt={t(altKey)}
                width={1000}
                height={1333}
                loading="lazy"
                style={{ width: '100%', borderRadius: 6, objectFit: 'cover', aspectRatio: '3/4', display: 'block' }}
              />
              <figcaption style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', marginTop: 8 }}>
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <a
          href="https://www.instagram.com/nithunm"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 24, fontSize: 13, color: 'var(--fgm)', textDecoration: 'none', transition: 'color 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
        >
          {t('about.instagram')}
        </a>
      </div>

      <div style={{ paddingBottom: 80 }} />
    </div>
  )
}
