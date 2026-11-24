import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../lib/usePageMeta'

// /silence/support — help and contact for Silence (website and iOS app).
// The App Store needs a support URL with real contact details: the email below.
// Text lives under support.* in the translation files. Keep the answers true to
// what the app and the site actually do; the health note matches the app's.
const EMAIL = 'nithun@tutamail.com'

// Questions and answers: support.faq.<id>.q, .a (and .a2 where there is one)
const FAQ = [
  { id: 'stops',     paras: ['a'] },
  { id: 'locked',    paras: ['a'] },
  { id: 'timer',     paras: ['a'] },
  { id: 'match',     paras: ['a', 'a2'] },
  { id: 'settings',  paras: ['a'] },
  { id: 'offline',   paras: ['a'] },
  { id: 'languages', paras: ['a'] },
]

export default function SilenceSupportPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.silenceSupportTitle'), description: t('meta.silenceSupportDescription'), path: '/silence/support' })

  return (
    <div className="page-enter shell">
      <section className="pg-hero">
        <Link to="/silence" viewTransition className="wp-back">← {t('support.back')}</Link>
        <h1 className="display pg-name" style={{ '--c': 'var(--sage)' }}>
          <span className="l"><span>{t('support.headingA')}</span></span>{' '}
          <span className="l l2"><span>{t('support.headingB')}</span></span>
        </h1>
        <p className="pg-intro enter">{t('support.intro')}</p>
      </section>

      <div className="policy">
        <section aria-labelledby="support-contact">
          <h2 id="support-contact">{t('support.contact.title')}</h2>
          <p>{t('support.contact.lead')} <a className="text-link" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
          <p>{t('support.contact.p2')}</p>
        </section>

        <section aria-labelledby="support-about">
          <h2 id="support-about">{t('support.about.title')}</h2>
          <p>{t('support.about.p1')}</p>
        </section>

        <section aria-labelledby="support-faq">
          <h2 id="support-faq">{t('support.faq.title')}</h2>
          {FAQ.map(({ id, paras }) => (
            <div key={id} className="faq-item">
              <h3>{t(`support.faq.${id}.q`)}</h3>
              {paras.map(p => <p key={p}>{t(`support.faq.${id}.${p}`)}</p>)}
            </div>
          ))}
        </section>

        <section aria-labelledby="support-health">
          <h2 id="support-health">{t('support.health.title')}</h2>
          <p>{t('support.health.p1')}</p>
        </section>

        <section aria-labelledby="support-privacy">
          <h2 id="support-privacy">{t('support.privacy.title')}</h2>
          <p>
            {t('support.privacy.p1')}{' '}
            <Link to="/silence/privacy" viewTransition className="text-link">{t('support.privacy.link')}</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
