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
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 'calc(780px + 160px)',
  margin: '0 auto',
}

export default function WritingPostPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()

  const post = posts.find(p => p.slug === slug)
  if (!post) return <Navigate to="/writing" replace />

  return (
    <div className="page-enter" style={SHELL}>
      {/* Post header */}
      <div
        style={{
          padding: '64px 0 48px',
          maxWidth: 780,
          borderBottom: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
          marginBottom: 48,
        }}
      >
        <Link
          to="/writing"
          style={{
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--fgm)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 32,
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
        >
          ← {t('writing.backWriting')}
        </Link>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(26px, 4.5vw, 44px)',
            fontWeight: 'normal',
            color: 'var(--fg)',
            lineHeight: 1.25,
            marginBottom: 16,
          }}
        >
          {post.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--fgm)', letterSpacing: '0.04em', flexWrap: 'wrap' }}>
          {post.date && <span>{formatDate(post.date, i18n.language)}</span>}
          {post.readTime && <><span style={{ opacity: 0.4 }}>·</span><span>{post.readTime}</span></>}
          {post.tags && post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
            <span key={tag}><span style={{ opacity: 0.4, marginRight: 8 }}>·</span>{tag}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 780,
          fontSize: 17,
          lineHeight: 1.82,
          color: 'var(--fg2)',
          fontWeight: 300,
        }}
        className="post-body"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p style={{ marginBottom: '1.5em' }}>{children}</p>,
            h2: ({ children }) => (
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 'normal', color: 'var(--fg)', margin: '2.5em 0 0.8em', lineHeight: 1.3 }}>
                {children}
              </h2>
            ),
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: '2px solid color-mix(in oklch, var(--stone) 50%, transparent)', padding: '4px 0 4px 24px', margin: '2em 0', fontStyle: 'italic', color: 'var(--fgm)', fontSize: 16 }}>
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} style={{ color: 'var(--dusty)', textDecoration: 'none', borderBottom: '1px solid color-mix(in oklch, var(--dusty) 40%, transparent)' }}>{children}</a>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      <div
        style={{
          maxWidth: 780,
          marginTop: 72,
          paddingTop: 32,
          borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {post.tags && (
          <div className="flex flex-wrap gap-2">
            {post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--fgm)',
                  border: '1px solid color-mix(in oklch, var(--fgm) 35%, transparent)',
                  padding: '2px 7px',
                  borderRadius: 2,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {post.mastodon && (
          <a
            href={post.mastodon}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: 'var(--fgm)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fg2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fgm)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
            {t('writing.conversation')}
          </a>
        )}
      </div>
    </div>
  )
}
