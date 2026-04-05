import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BooksPage() {
  const { t } = useTranslation()

  const items = t('books.items', { returnObjects: true })
  const introParagraphs = t('books.introFull', { returnObjects: true }).split('\n\n')

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        {t('books.backHome')}
      </Link>
      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-6">
        {t('books.heading')}
      </h1>
      <div className="space-y-4 text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 mb-12 max-w-xl">
        {introParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <ul className="space-y-10">
        {items.map((book, i) => (
          <li key={i}>
            <h2 className="font-serif font-semibold text-xl mb-3">{book.author}</h2>

            {book.paragraphs ? (
              <div className="max-w-xl">
                {book.paragraphs.map((para, j) => (
                  <div key={j}>
                    <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{para}</p>
                    {j < book.paragraphs.length - 1 && (
                      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
                    )}
                  </div>
                ))}
              </div>
            ) : book.textBefore ? (
              <div className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-xl">
                <p className="mb-2">{book.textBefore}</p>
                <ul className="list-disc list-inside mb-3 space-y-1 text-sm">
                  {book.series.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
                <p>{book.textAfter}</p>
              </div>
            ) : book.text ? (
              <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-xl">
                {book.text}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
