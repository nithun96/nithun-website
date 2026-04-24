import { Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseFrontmatter, slugFromPath } from '../lib/parseFrontmatter'

const rawFiles = import.meta.glob('../writing/*.md', { query: '?raw', import: 'default', eager: true })

const posts = Object.entries(rawFiles).map(([path, raw]) => {
  const { data, content } = parseFrontmatter(raw)
  return { ...data, slug: slugFromPath(path), content }
})

function formatDate(dateStr, locale) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(locale === 'no' ? 'nb-NO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function WritingPostPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()

  const post = posts.find(p => p.slug === slug)
  if (!post) return <Navigate to="/writing" replace />

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/writing"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        {t('writing.backWriting')}
      </Link>

      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-3">
        {post.title}
      </h1>

      {post.date && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-12">
          {formatDate(post.date, i18n.language)}
        </p>
      )}

      <div className="prose prose-zinc dark:prose-invert max-w-xl
        prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-300
        prose-headings:font-serif prose-headings:font-semibold prose-headings:tracking-tight
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
        prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {post.mastodon && (
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700">
          <a
            href={post.mastodon}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline underline-offset-4"
          >
            {t('writing.conversation')}
          </a>
        </div>
      )}
    </div>
  )
}
