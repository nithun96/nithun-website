import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseFrontmatter, slugFromPath } from '../lib/parseFrontmatter'

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

const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 'calc(780px + 160px)',
  margin: '0 auto',
}

export default function WritingPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="page-enter" style={SHELL}>
      {/* Header */}
      <div
        style={{
          padding: '56px 0 48px',
          borderBottom: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)',
        }}
      >
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 10 }}>
          {t('writing.heading')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fgm)', letterSpacing: '0.03em' }}>
          {t('writing.subtitle')}
        </p>
      </div>

      {/* List */}
      <ul className="list-none p-0 m-0">
        {posts.map(post => (
          <li
            key={post.slug}
            style={{ borderBottom: '1px solid color-mix(in oklch, var(--fg) 7%, transparent)' }}
          >
            <Link
              to={`/writing/${post.slug}`}
              style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24, padding: '32px 0', textDecoration: 'none' }}
              className="group max-[560px]:block max-[560px]:py-6"
            >
              <div style={{ fontSize: 12, color: 'var(--fgm)', letterSpacing: '0.04em', paddingTop: 4, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>
                {formatDate(post.date, i18n.language) ?? t('writing.noDate')}
              </div>
              <div>
                <div
                  style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 'normal', color: 'var(--fg2)', lineHeight: 1.35, marginBottom: 8, transition: 'color 0.2s ease' }}
                  className="group-hover:text-fg"
                >
                  {post.title}
                </div>
                {post.summary && (
                  <div style={{ fontSize: 14, color: 'var(--fgm)', lineHeight: 1.6, maxWidth: 560 }}>
                    {post.summary}
                  </div>
                )}
                {post.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
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
                    {post.readTime && (
                      <span
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
                        {post.readTime}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
