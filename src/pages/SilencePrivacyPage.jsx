import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../lib/usePageMeta'

// /silence/privacy — the privacy policy for Silence (website and iOS app).
// The App Store needs it: the app links here. Text lives under privacy.* in
// the translation files; change the "updated" date there when the policy changes.
const EMAIL = 'nithun@tutamail.com'

// Each section: a heading and its paragraphs (privacy.<id>.title, .p1, .p2 …)
const SECTIONS = [
  { id: 'who',      paras: ['p1'] },
  { id: 'app',      paras: ['p1', 'p2', 'p3', 'p4'] },
  { id: 'web',      paras: ['p1', 'p2', 'p3', 'p4'] },
  { id: 'changes',  paras: ['p1'] },
]

export default function SilencePrivacyPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.silencePrivacyTitle'), description: t('meta.silencePrivacyDescription'), path: '/silence/privacy' })

  return (
    <div className="page-enter shell">
      <section className="pg-hero">
        <Link to="/silence" viewTransition className="wp-back">← {t('privacy.back')}</Link>
        <h1 className="display pg-name" style={{ '--c': 'var(--sage)' }}>
          <span className="l"><span>{t('privacy.headingA')}</span></span>{' '}
          <span className="l l2"><span>{t('privacy.headingB')}</span></span>
        </h1>
        <p className="pg-intro enter">{t('privacy.intro')}</p>
        <p className="policy-date enter">{t('privacy.updated')}</p>
      </section>

      <div className="policy">
        {SECTIONS.map(({ id, paras }) => (
          <section key={id} aria-labelledby={`policy-${id}`}>
            <h2 id={`policy-${id}`}>{t(`privacy.${id}.title`)}</h2>
            {paras.map(p => <p key={p}>{t(`privacy.${id}.${p}`)}</p>)}
          </section>
        ))}
        <section aria-labelledby="policy-contact">
          <h2 id="policy-contact">{t('privacy.contact.title')}</h2>
          <p>{t('privacy.contact.p1')}</p>
          <p>{t('privacy.contact.link')} <a className="text-link" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
          <p>{t('privacy.contact.supportLead')} <Link to="/silence/support" viewTransition className="text-link">{t('privacy.contact.supportLink')}</Link></p>
          <p>{t('privacy.contact.p2')}</p>
        </section>
      </div>
    </div>
  )
}
