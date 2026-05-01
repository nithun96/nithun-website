import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import shelfData from '../data/shelf.json'

const CATEGORIES = ['books', 'series', 'games']
const STATUSES   = ['all', 'current', 'finished', 'want']

const TAB_ACCENTS  = { books: 'var(--wheat)', series: 'var(--dusty)', games: 'var(--sage)' }
const COVER_RATIOS = { books: '2/3', series: '3/4', games: '4/3' }

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
            data-cat={c}
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
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '48px 0',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--fgm)',
            }}
          >
            {t('shelf.empty')}
          </div>
        ) : filtered.map((item, i) => (
          <div key={i} className="shelf-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Cover */}
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
              {/* Spine */}
              <div
                className="shelf-spine"
                style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: 4,
                  borderRadius: '2px 0 0 2px',
                }}
              />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--fgm)', letterSpacing: '0.06em', lineHeight: 1.7, position: 'relative' }}>
                {item.title}
              </span>
            </div>
            {/* Meta */}
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.4 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fgm)', lineHeight: 1.4 }}>{item.sub}</div>
            <div style={{ fontSize: 10, color: 'color-mix(in oklch, var(--fgm) 70%, transparent)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: DOT_COLORS[item.status],
                  flexShrink: 0,
                }}
              />
              {t(`shelf.statusLabels.${item.status}`)}
              {item.meta ? ` · ${item.meta}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
