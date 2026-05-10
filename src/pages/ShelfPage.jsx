import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import shelfData from '../data/shelf.json'
import { getBookCover } from '../utils/bookCovers'

const CATEGORIES = ['books', 'games', 'tv']
const STATUSES   = ['all', 'current', 'finished', 'want']

const TAB_ACCENTS  = { books: 'var(--wheat)', games: 'var(--sage)', tv: 'var(--dusty)' }
const COVER_RATIOS = { books: '2/3', games: '3/4', tv: '2/3' }

const DOT_COLORS = {
  current:  'var(--sage)',
  finished: 'color-mix(in oklch, var(--fgm) 45%, transparent)',
  want:     'color-mix(in oklch, var(--wheat) 50%, transparent)',
}

const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 'calc(780px + 160px)',
  margin: '0 auto',
}

// ── Book card with Open Library cover fetch ───────────────────────────────────

function BookCard({ book, index }) {
  const { t } = useTranslation()
  const [imageUrl, setImageUrl] = useState(null)
  const [imageOk,  setImageOk]  = useState(false)
  const fallbackAttempted = useRef(false)

  useEffect(() => {
    if (book.coverUrl) {
      setImageUrl(book.coverUrl)
    } else {
      getBookCover(book.title, book.author, book.isbn || null).then(setImageUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Called when the initial cover 404s or returns a 1px placeholder.
  // Already tried both sources in getBookCover, so this just prevents retry loops.
  function tryFallback() {
    if (fallbackAttempted.current) return
    fallbackAttempted.current = true
    // Both sources have been exhausted by the initial call
  }

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
            onLoad={e => {
              if (e.currentTarget.naturalWidth < 10) tryFallback()
              else setImageOk(true)
            }}
            onError={tryFallback}
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
      <div style={{ fontSize: 10, color: 'color-mix(in oklch, var(--fgm) 70%, transparent)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: DOT_COLORS[book.status], flexShrink: 0 }} />
        {t(`shelf.statusLabels.${book.status}`)}
        {bookMeta ? ` · ${bookMeta}` : ''}
      </div>
    </div>
  )
}

// ── Shelf page ────────────────────────────────────────────────────────────────

export default function ShelfPage() {
  const { t } = useTranslation()
  const [cat, setCat]       = useState('books')
  const [status, setStatus] = useState('all')

  const items    = shelfData[cat]
  const filtered = status === 'all' ? items : items.filter(i => i.status === status)

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

      {/* Category tabs */}
      <div
        className="flex"
        style={{ paddingTop: 32, borderTop: '1px solid color-mix(in oklch, var(--fg) 8%, transparent)', marginTop: 32 }}
      >
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => { setCat(c); setStatus('all') }}
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

      {/* Status filters */}
      <div className="flex flex-wrap gap-2" style={{ paddingTop: 20 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: status === s ? 'var(--fg2)' : 'var(--fgm)',
              background: status === s ? 'color-mix(in oklch, var(--fg) 5%, transparent)' : 'none',
              border: `1px solid ${status === s ? 'color-mix(in oklch, var(--fg) 35%, transparent)' : 'color-mix(in oklch, var(--fgm) 28%, transparent)'}`,
              borderRadius: 2,
              padding: '4px 11px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {t(`shelf.filters.${s}`)}
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
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '48px 0', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--fgm)' }}>
            {t('shelf.empty')}
          </div>
        ) : filtered.map((item, i) => (
          cat === 'books' ? (
            <BookCard key={i} book={item} index={i} />
          ) : (
            <div key={i} className="shelf-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: COVER_RATIOS[cat],
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
                <div className="shelf-spine" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '2px 0 0 2px' }} />
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--fgm)', letterSpacing: '0.06em', lineHeight: 1.7, position: 'relative' }}>
                  {item.title}
                </span>
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fgm)', lineHeight: 1.4 }}>
                {item.platform || item.category}
              </div>
              <div style={{ fontSize: 10, color: 'color-mix(in oklch, var(--fgm) 70%, transparent)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: DOT_COLORS[item.status], flexShrink: 0 }} />
                {t(`shelf.statusLabels.${item.status}`)}
                {item.note ? ` · ${item.note}` : ''}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
