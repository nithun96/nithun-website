import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseFrontmatter } from '../lib/parseFrontmatter'

const rawFiles = import.meta.glob('../writing/*.md', { query: '?raw', import: 'default', eager: true })

const posts = Object.values(rawFiles)
  .map(raw => {
    const { data, content } = parseFrontmatter(raw)
    return { ...data, content }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

function formatDate(dateStr, locale) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(locale === 'no' ? 'nb-NO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function WritingPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        ← Nithun Manoharan
      </Link>

      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-12">
        {t('writing.heading')}
      </h1>

      <ul className="space-y-10">
        {posts.map(post => (
          <li key={post.slug}>
            <Link to={`/writing/${post.slug}`} className="group block">
              <h2 className="font-serif font-semibold text-xl mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
                {post.title}
              </h2>
              {post.date && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  {formatDate(post.date, i18n.language)}
                </p>
              )}
              {post.summary && (
                <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-xl">
                  {post.summary}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
