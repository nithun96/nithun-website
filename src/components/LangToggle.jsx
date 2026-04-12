import { useTranslation } from 'react-i18next'

export default function LangToggle() {
  const { i18n, t } = useTranslation()

  const toggle = () => {
    const next = i18n.language.startsWith('no') ? 'en' : 'no'
    i18n.changeLanguage(next)
    document.documentElement.lang = next
  }

  return (
    <button
      onClick={toggle}
      aria-label={t('nav.toggleLang')}
      className="text-sm px-2 py-1 rounded border border-current hover:border-amber-600 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-400 active:opacity-40 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
    >
      {t('nav.toggleLang')}
    </button>
  )
}
