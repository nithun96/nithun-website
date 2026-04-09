import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPostBySlug } from '../data/blogPosts'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="px-6 py-16 max-w-3xl mx-auto w-full">
        <Link
          to="/blog"
          className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
        >
          {t('blog.backToBlog')}
        </Link>
        <p className="text-zinc-500 dark:text-zinc-400">{t('blog.notFound')}</p>
      </div>
    )
  }

  return (
    <article className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/blog"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        {t('blog.backToBlog')}
      </Link>
      <time
        dateTime={post.date}
        className="text-sm text-zinc-400 dark:text-zinc-500 block mb-3"
      >
        {new Date(post.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </time>
      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-10">
        {post.title}
      </h1>
      <div className="space-y-5 max-w-xl text-base md:text-lg leading-relaxed">
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
