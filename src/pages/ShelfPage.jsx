import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import shelfData from '../data/shelf.json'
import { getBookCover } from '../utils/bookCovers'
import { SHELL } from '../styles/shell'
import { usePageMeta } from '../lib/usePageMeta'

// Games and TV are hidden until they have cover art (see "Cover Art for
// Games & TV" in CLAUDE.md) — re-add 'games', 'tv' once that's done.
const CATEGORIES = ['books']

const TAB_ACCENTS  = { books: 'var(--wheat)', games: 'var(--sage)', tv: 'var(--dusty)' }
const COVER_RATIOS = { books: '2/3', games: '3/4', tv: '2/3' }

// ── Book card ─────────────────────────────────────────────────────────────────

function BookCard({ book }) {
  const imageUrl = book.coverUrl ?? getBookCover(book.title)
  const [imageOk, setImageOk] = useState(false)

  const bookMeta = book.number != null ? `#${book.number}` : book.note || ''

  return (
    <div className="shelf-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Cover */}
      <div
        style={{
          width: '100%',
          aspectRatio: COVER_RATIOS.books,
          background: 'var(--bg2)',
          borderRadius: 3,
          border: '1px solid color-mix(in oklch, var(--fg) 6%, transparent)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: '10px 10px 10px 18px',
          transition: 'border-color 0.2s',
          cursor: 'default',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 16%, transparent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--fg) 6%, transparent)'}
      >
        <div
          className="shelf-spine"
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 4,
            borderRadius: '2px 0 0 2px',
            opacity: imageOk ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
        <span style={{
          fontSize: 9,
          fontFamily: 'monospace',
          color: 'var(--fgm)',
          letterSpacing: '0.06em',
          lineHeight: 1.7,
          position: 'relative',
          opacity: imageOk ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}>
          {book.title}
        </span>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={book.title}
            loading="lazy"
            onLoad={() => setImageOk(true)}
            onError={() => {}}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageOk ? 1 : 0,
              transition: 'opacity 0.3s ease',
              display: 'block',
            }}
          />
        )}
      </div>
      {/* Meta */}
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.4 }}>
        {book.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--fgm)', lineHeight: 1.4 }}>{book.author}</div>
      {bookMeta && (
        <div style={{ fontSize: 10, color: 'color-mix(in oklch, var(--fgm) 70%, transparent)', letterSpacing: '0.06em' }}>
          {bookMeta}
        </div>
      )}
    </div>
  )
}

// ── Shelf page ────────────────────────────────────────────────────────────────

export default function ShelfPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.shelfTitle'), description: t('meta.shelfDescription'), path: '/shelf' })
  const [cat, setCat]       = useState('books')
  // Book/game/TV cover art shouldn't surface in Google Images for name
  // searches — keep it out of image search without affecting page ranking.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noimageindex'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  const items = shelfData[cat]

  return (
    <div className="page-enter" style={SHELL}>
      {/* Page header */}
      <div style={{ padding: '56px 0 0', borderTop: 'none' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 'normal', color: 'var(--fg)', marginBottom: 10 }}>
          {t('shelf.heading')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fgm)', letterSpacing: '0.03em', marginBottom: 0 }}>
          {t('shelf.subtitle')}
        </p>
      </div>

      {/* Category tabs — hidden when there's only one category to switch between */}
      <div
        className="flex"
        style={{ paddingTop: 32, borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)', marginTop: 32 }}
      >
        {CATEGORIES.length > 1 && CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: cat === c ? 'var(--fg)' : 'var(--fgm)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${cat === c ? TAB_ACCENTS[c] : 'transparent'}`,
              padding: '8px 0',
              marginRight: 24,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {t(`shelf.tabs.${c}`)}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '24px 20px',
          padding: '32px 0 80px',
        }}
      >
        {items.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '48px 0', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--fgm)' }}>
            {t('shelf.empty')}
          </div>
        ) : items.map((item, i) => (
          cat === 'books' ? (
            <BookCard key={i} book={item} />
          ) : (
            <div
              key={i}
              className="shelf-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '10px 12px 10px 16px',
                background: 'var(--bg2)',
                borderRadius: 3,
                border: '1px solid color-mix(in oklch, var(--fg) 6%, transparent)',
                borderLeft: `3px solid ${TAB_ACCENTS[cat]}`,
                transition: 'opacity 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fgm)', lineHeight: 1.4 }}>
                {item.platform || item.category}
              </div>
              {item.note && (
                <div style={{ fontSize: 10, color: 'color-mix(in oklch, var(--fgm) 70%, transparent)', letterSpacing: '0.06em' }}>
                  {item.note}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
