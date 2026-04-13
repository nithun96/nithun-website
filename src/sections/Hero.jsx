import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function Hero() {
  const { t } = useTranslation()
  const [headerVisible, setHeaderVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 80)
    const t2 = setTimeout(() => setTextVisible(true), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <section className="px-6 py-24 max-w-3xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-start gap-10">

        {/* Photo */}
        <div
          className="shrink-0 transition-all duration-700 ease-out"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(12px)' }}
        >
          <img
            src="/images/nithun.jpeg"
            alt="Nithun Manoharan"
            width={800}
            height={800}
            className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover object-center ring-2 ring-zinc-300 dark:ring-zinc-600"
          />
        </div>

        {/* Name + location + text */}
        <div>
          <div
            className="transition-all duration-700 ease-out"
            style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(12px)' }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight mb-2">
              {t('hero.name')}
            </h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {t('hero.location')}
            </p>
          </div>

          <div
            className="transition-all duration-700 ease-out"
            style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(12px)' }}
          >
            <p className="text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              {t('hero.intro')}
            </p>
            <p className="mt-4 text-sm italic text-zinc-400 dark:text-zinc-500">
              {t('hero.teaser')}<sup>TM</sup>
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
