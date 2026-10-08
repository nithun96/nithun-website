import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en/translation.json'
import no from './locales/no/translation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      no: { translation: no },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'no'],
    interpolation: {
      escapeValue: false,
    },
  })

const syncHtmlLang = lng => { document.documentElement.lang = (lng || 'en').startsWith('no') ? 'no' : 'en' }
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
