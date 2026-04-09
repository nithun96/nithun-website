import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { blogPosts } from '../data/blogPosts'

export default function BlogsPage() {
  const { t } = useTranslation()

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        to="/"
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline underline-offset-4 active:opacity-40 transition-opacity block mb-10"
      >
        {t('blog.backHome')}
      </Link>
      <h1 className="text-3xl md:text-5xl font-serif font-semibold tracking-tight mb-6">
        {t('blog.heading')}
      </h1>
      <p className="text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 mb-12 max-w-xl">
        {t('blog.intro')}
      </p>

      {blogPosts.length === 0 ? (
        <p className="text-zinc-400 dark:text-zinc-500 italic">{t('blog.empty')}</p>
      ) : (
        <ul className="space-y-8">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block"
              >
                <time
                  dateTime={post.date}
                  className="text-sm text-zinc-400 dark:text-zinc-500 block mb-1"
                >
                  {new Date(post.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
                <h2 className="font-serif font-semibold text-xl mb-2 group-hover:underline underline-offset-4">
                  {post.title}
                </h2>
                <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-xl">
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
