import { useTranslation, Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SHELL } from '../styles/shell'
import { usePageMeta } from '../lib/usePageMeta'

const PHOTOS = [
  { file: 'photo-wroclaw-night.webp',      altKey: 'about.photoWroclawAlt',    placeKey: 'about.placeWroclaw' },
  { file: 'photo-red-windows.webp',        altKey: 'about.photoRedWindowsAlt', placeKey: 'about.placeCopenhagen' },
  { file: 'photo-heddal-church.webp',      altKey: 'about.photoHeddalAlt',     placeKey: 'about.placeHeddal' },
  { file: 'photo-sunflare-building.webp',  altKey: 'about.photoSunflareAlt',   placeKey: 'about.placeStockholm' },
  { file: 'photo-inari-fox.webp',          altKey: 'about.photoInariAlt',      placeKey: 'about.placeKyoto' },
  { file: 'photo-riga-cathedral.webp',     altKey: 'about.photoRigaAlt',       placeKey: 'about.placeRiga' },
]

const CAPTION = { fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', marginTop: 8 }
const PORTRAIT = { flex: 1, minWidth: 0, width: '100%', borderRadius: 6, objectFit: 'cover', aspectRatio: '3/4' }

// The browser picks the smallest copy that is sharp on the visitor's screen.
// Portraits: two side by side, at most 300px wide. Travel photos: full width
// on phones, three in a row (at most 341px) on wider screens.
const PORTRAIT_SIZES = '(max-width: 660px) 45vw, 300px'
const PHOTO_SIZES = '(max-width: 640px) calc(100vw - 48px), 341px'

export default function AboutPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.aboutTitle'), description: t('meta.aboutDescription'), path: '/about' })

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

      {/* Two photos of Nithun, side by side at the same size */}
      <figure style={{ margin: '32px 0 0', maxWidth: 620 }}>
        <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 20px)' }}>
          {['nithun-portrait', 'nithun-flower-field'].map((name, i) => (
            <img
              key={name}
              src={`/images/about/${name}.webp`}
              srcSet={`/images/about/${name}-sm.webp 324w, /images/about/${name}-600.webp 600w, /images/about/${name}.webp 900w`}
              sizes={PORTRAIT_SIZES}
              alt={t(i === 0 ? 'about.portraitAlt' : 'about.flowerAlt')}
              width={900}
              height={1200}
              fetchPriority={i === 0 ? 'high' : undefined}
              style={PORTRAIT}
            />
          ))}
        </div>
        <figcaption style={CAPTION}>{t('about.portraitsCaption')}</figcaption>
      </figure>

      {/* Bio */}
      <div style={{ marginTop: 32, maxWidth: 620 }}>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--fg2)', fontWeight: 300, marginBottom: 16 }}>
          <Trans
            i18nKey="about.bio1"
            components={[
              <a href="https://pyre.no" className="text-link" target="_blank" rel="noopener noreferrer" />,
              <Link to="/writing" className="text-link" />,
              <Link to="/silence" className="text-link" />,
              <Link to="/shelf" className="text-link" />,
            ]}
          />
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--fg2)', fontWeight: 300 }}>
          {t('about.bio2')}
        </p>
      </div>

      {/* Photography: follows straight on from the travel paragraph */}
      <div style={{ marginTop: 32 }}>
        <div className="about-photo-grid">
          {PHOTOS.map(({ file, altKey, placeKey }) => (
            <figure key={file} style={{ margin: 0 }}>
              <img
                src={`/images/about/${file}`}
                srcSet={`/images/about/${file.replace('.webp', '-700.webp')} 700w, /images/about/${file} 1000w`}
                sizes={PHOTO_SIZES}
                alt={t(altKey)}
                width={1000}
                height={1333}
                loading="lazy"
                style={{ width: '100%', borderRadius: 6, objectFit: 'cover', aspectRatio: '3/4', display: 'block' }}
              />
              <figcaption style={CAPTION}>{t(placeKey)}</figcaption>
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
        <p style={{ fontSize: 11, color: 'var(--fgm)', letterSpacing: '0.04em', marginTop: 32 }}>
          {t('about.photosRights')}
        </p>
      </div>

      <div style={{ paddingBottom: 80 }} />
    </div>
  )
}
