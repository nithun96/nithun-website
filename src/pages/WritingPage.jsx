import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseFrontmatter, slugFromPath } from '../lib/parseFrontmatter'
import { SHELL } from '../styles/shell'
import { usePageMeta } from '../lib/usePageMeta'

const rawFiles = import.meta.glob('../writing/*.md', { query: '?raw', import: 'default', eager: true })

const posts = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw)
    return { ...data, slug: slugFromPath(path), content }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

function formatDate(dateStr, locale) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(locale === 'no' ? 'nb-NO' : 'en-GB', {
    month: 'short', year: 'numeric',
  })
}

const splitTags = tags => (tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [])

export default function WritingPage() {
  const { t, i18n } = useTranslation()
  usePageMeta({ title: t('meta.writingTitle'), description: t('meta.writingDescription'), path: '/writing' })

  return (
    <div className="page-enter" style={SHELL}>
      <section className="pg-hero">
        <h1 className="display pg-name" style={{ '--c': 'var(--dusty)' }}>
          <span className="l"><span>{t('writing.heading')}</span></span>{' '}
          <span className="l l2"><span>{t('writing.headingTail')}</span></span>
        </h1>
        <p className="pg-intro enter">{t('writing.subtitle')}</p>
      </section>

      <ol className="posts">
        {posts.map(post => (
          <li key={post.slug} className="post-row">
            <Link to={`/writing/${post.slug}`} className="post-link" viewTransition>
              <span className="post-date">{formatDate(post.date, i18n.language) ?? t('writing.noDate')}</span>
              <span className="post-main">
                <span className="post-title" lang={post.language || 'en'}>{post.title}</span>
                {post.summary && <span className="post-sum" lang={post.language || 'en'}>{post.summary}</span>}
                <span className="post-tags">
                  <span className="r-lang">{(post.language || 'en').toUpperCase()}</span>
                  {splitTags(post.tags).map(tag => <span key={tag} className="r-lang">{tag}</span>)}
                  {post.readTime && <span className="r-lang">{post.readTime}</span>}
                </span>
              </span>
              <span className="r-go" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="rss-line">
        {t('writing.rssFollow')}{' '}
        <a href="/rss.xml" type="application/rss+xml" className="text-link">nithun.no/rss.xml</a>
      </p>
    </div>
  )
}
