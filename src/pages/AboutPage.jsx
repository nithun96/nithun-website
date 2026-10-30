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

// The browser picks the smallest copy that is sharp on the visitor's screen.
// Portraits: two side by side, about 45% of a phone screen, at most 260px
// beside the bio. Travel photos: full width on phones, three in a row (at most
// 341px) on wider screens.
const PORTRAIT_SIZES = '(max-width: 760px) 45vw, 260px'
const PHOTO_SIZES = '(max-width: 640px) calc(100vw - 48px), 341px'

export default function AboutPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.aboutTitle'), description: t('meta.aboutDescription'), path: '/about' })

  return (
    <div className="page-enter" style={SHELL}>
      <section className="pg-hero">
        <h1 className="display pg-name about-name" style={{ '--c': 'var(--stone)' }}>
          <span className="l"><span>{t('about.eyebrow')}</span></span>{' '}
          <span className="l l2"><span>{t('hero.name')}</span></span>
        </h1>
      </section>

      <div className="about-grid">
        {/* Two photos of Nithun, side by side at the same size */}
        <figure className="about-portraits">
          <div>
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
              />
            ))}
          </div>
          <figcaption>{t('about.portraitsCaption')}</figcaption>
        </figure>

        <div className="about-bio">
          <p className="about-lead">
            <Trans
              i18nKey="about.bio1"
              components={[
                <a href="https://pyre.no" className="text-link" target="_blank" rel="noopener noreferrer" />,
                <Link to="/writing" className="text-link" viewTransition />,
                <Link to="/silence" className="text-link" viewTransition />,
                <Link to="/shelf" className="text-link" viewTransition />,
              ]}
            />
          </p>
          <p>{t('about.bio2')}</p>
        </div>
      </div>

      {/* Photography: follows straight on from the travel paragraph */}
      <div className="about-photo-grid">
        {PHOTOS.map(({ file, altKey, placeKey }) => (
          <figure key={file}>
            <img
              src={`/images/about/${file}`}
              srcSet={`/images/about/${file.replace('.webp', '-700.webp')} 700w, /images/about/${file} 1000w`}
              sizes={PHOTO_SIZES}
              alt={t(altKey)}
              width={1000}
              height={1333}
              loading="lazy"
            />
            <figcaption>{t(placeKey)}</figcaption>
          </figure>
        ))}
      </div>
      <a className="about-more" href="https://www.instagram.com/nithunm" target="_blank" rel="noopener noreferrer">
        {t('about.instagram')}
      </a>
      <p className="about-rights">{t('about.photosRights')}</p>
    </div>
  )
}
