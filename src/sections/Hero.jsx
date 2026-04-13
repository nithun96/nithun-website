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
    <section className="px-6 py-32 max-w-3xl mx-auto w-full">

      {/* Photo + name */}
      <div
        className="flex flex-col md:flex-row md:items-center gap-10 mb-16 transition-all duration-700 ease-out"
        style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <img
          src="/images/nithun.jpeg"
          alt="Nithun Manoharan"
          width={800}
          height={800}
          className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover object-center shrink-0"
        />
        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight">
          {t('hero.name')}
        </h1>
      </div>

      {/* Intro text */}
      <div
        className="transition-all duration-700 ease-out"
        style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <p className="text-base md:text-lg leading-relaxed max-w-lg text-zinc-600 dark:text-zinc-300">
          {t('hero.intro')}
        </p>
      </div>

    </section>
  )
}
