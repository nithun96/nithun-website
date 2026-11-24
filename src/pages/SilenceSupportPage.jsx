import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../lib/usePageMeta'

// /silence/support — help and contact for Silence (website and iOS app).
// The App Store needs a support URL with real contact details: the email below.
// Text lives under support.* in the translation files. Keep the answers true to
// what the app and the site actually do; the health note matches the app's.
const EMAIL = 'nithun@tutamail.com'

// Questions and answers (support.faq.<id>.q/.a). Keep it to what people
// actually get stuck on; the intro and the app explain the rest.
const FAQ = ['stops', 'match', 'settings', 'offline']

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

        <section aria-labelledby="support-faq">
          <h2 id="support-faq">{t('support.faq.title')}</h2>
          {FAQ.map(id => (
            <div key={id} className="faq-item">
              <h3>{t(`support.faq.${id}.q`)}</h3>
              <p>{t(`support.faq.${id}.a`)}</p>
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
