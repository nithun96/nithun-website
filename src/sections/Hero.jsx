import { useTranslation } from 'react-i18next'

export default function Hero() {
  const { t } = useTranslation()

  const paragraphs = t('hero.intro', { returnObjects: true })

  return (
    <section className="px-6 py-24 max-w-3xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center gap-10 mb-10">
        <img
          src="/images/nithun.jpeg"
          alt="Nithun Manoharan"
          width={800}
          height={800}
          className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover object-center shrink-0"
        />
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight mb-4">
            {t('hero.name')}
          </h1>
          <p className="text-xl font-serif italic text-zinc-500 dark:text-zinc-400">
            {t('hero.tagline')}
          </p>
        </div>
      </div>
      <h2 className="text-2xl font-serif font-semibold tracking-tight mb-4">
        {t('hero.rambleHeading')}
      </h2>
      <div className="space-y-4 max-w-xl text-base md:text-lg leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  )
}
