import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import shelfData from '../data/shelf.json'
import spines from '../data/bookSpines.json'
import { getBookCover } from '../utils/bookCovers'
import { usePageMeta } from '../lib/usePageMeta'

// Books only for now: Games and TV are hidden until they have cover art
// (see "Cover Art for Games & TV" in CLAUDE.md).
//
// Each series stands on a plank, labelled underneath like a library shelf.
// A book photographed on Nithun's own shelves shows its real spine
// (src/data/bookSpines.json, images in public/images/shelf/spines/); the rest
// get a drawn spine until they're photographed.

const SPINE_H = 238      // paperback height on the page, px
const SPINE_H_HC = 272   // hardcover
const SERIES_KEYS = {    // series renamed on the page; the rest show as written
  'Standalone': 'standalone',
  'Standalone — Sanderson': 'standaloneSanderson',
  'Warcraft — War of the Ancients': 'warOfTheAncients',
}

// Same title, same drawn-spine size every time
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function groupBooks(books) {
  const groups = new Map()
  for (const b of books) {
    const s = b.series || 'Standalone'
    if (!groups.has(s)) groups.set(s, [])
    groups.get(s).push(b)
  }
  // Biggest series first, standalones last
  return [...groups.entries()]
    .sort(([a, x], [b, y]) => (a.startsWith('Standalone') - b.startsWith('Standalone')) || y.length - x.length)
}

// "Pick one for me" only hands out books you can start with: any standalone,
// and one book per series (book 1, or the first listed if it isn't numbered).
function startingBooks(groups) {
  return groups.flatMap(g => {
    if (g.series.startsWith('Standalone')) return g.books
    const numbered = g.books.filter(b => b.number >= 1).sort((a, b) => a.number - b.number)
    return [numbered[0] || g.books[0]]
  })
}

export default function ShelfPage() {
  const { t } = useTranslation()
  usePageMeta({ title: t('meta.shelfTitle'), description: t('meta.shelfDescription'), path: '/shelf' })
  const [selected, setSelected] = useState(null)   // book title
  const [coverFailed, setCoverFailed] = useState({})   // titles whose cover didn't load
  const spineRefs = useRef(new Map())   // title → spine button, for "Pick one for me"
  const picked = useRef(null)           // title picked by the button, scrolled to after render

  // Book spines and covers belong to their publishers: keep them out of image
  // search for Nithun's name. Nginx also sends this as a header.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noimageindex'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  // Escape puts the book back
  useEffect(() => {
    if (!selected) return
    const onKey = e => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const groups = useMemo(() => {
    let colour = 0
    return groupBooks(shelfData.books).map(([series, books]) => ({
      series,
      name: SERIES_KEYS[series] ? t(`shelf.series.${SERIES_KEYS[series]}`) : series,
      books: books.map((b, i) => {
        const photo = spines[b.title]
        const h = photo ? (photo.hardcover ? SPINE_H_HC : SPINE_H) : 196 + (hash(b.title) % 56)
        const w = photo ? Math.round(h * photo.w / 600) : 38 + ((hash(b.title) >> 8) % 16)
        return { ...b, photo, h, w, colour: colour++ % 7, delay: 0.2 + Math.min(i, 14) * 0.02 }
      }),
    }))
  }, [t])

  // After "Pick one for me": bring the chosen spine into view and give it focus,
  // so keyboard users carry on from there. No smooth scroll under reduced motion.
  useEffect(() => {
    if (!selected || picked.current !== selected) return
    picked.current = null
    const el = spineRefs.current.get(selected)
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: still ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }, [selected])

  const pickOne = () => {
    const options = startingBooks(groups).filter(b => b.title !== selected)
    const book = options[Math.floor(Math.random() * options.length)]
    picked.current = book.title
    setSelected(book.title)
  }

  const pick = groups.flatMap(g => g.books.map(b => ({ ...b, group: g }))).find(b => b.title === selected)
  let line = ''
  if (pick) {
    const series = pick.group.name
    if (pick.series?.startsWith('Standalone') || pick.number == null) line = series
    else if (pick.number === 0) line = t('shelf.prequel', { series })
    else line = t('shelf.bookN', { n: pick.number, series })
  }
  const cover = pick && !pick.photo && !coverFailed[pick.title] ? getBookCover(pick.title) : null

  return (
    <div className="page-enter shell">
      <section className="sh-hero">
        <div>
          <h1 className="display sh-name" style={{ '--c': 'var(--honey)' }}>
            <span className="l"><span>{t('shelf.heading')}</span></span>{' '}
            <span className="l l2"><span>{t('shelf.headingTail')}</span></span>
          </h1>
          <p className="sh-intro enter">{t('shelf.intro')}</p>
          <div className="sh-pick enter">
            <button type="button" className="pill sh-pick-btn" onClick={pickOne} aria-describedby="sh-pick-hint">
              <span className="sh-pick-dot" aria-hidden="true" />{t('shelf.pickOne')}
            </button>
            <p id="sh-pick-hint" className="sh-pick-hint">{t('shelf.pickOneHint')}</p>
          </div>
        </div>
        <p className="sh-count enter"><b>{shelfData.books.length}</b><span>{t('shelf.books')}</span></p>
      </section>

      <div className="case">
        {groups.map((g, gi) => (
          <section key={g.series} className="group" aria-labelledby={`shelf-${gi}`}>
            <div className="spines">
              {g.books.map(b => (
                <button
                  key={b.title}
                  ref={el => { if (el) spineRefs.current.set(b.title, el); else spineRefs.current.delete(b.title) }}
                  type="button"
                  className={`spine${b.photo ? ' photo' : ''}`}
                  style={{ '--h': `${b.h}px`, '--w': `${b.w}px`, '--s': `var(--sp${b.colour})`, animationDelay: `${b.delay}s` }}
                  onClick={() => setSelected(selected === b.title ? null : b.title)}
                  aria-pressed={selected === b.title}
                  aria-label={t('shelf.bookLabel', { title: b.title, author: b.author })}
                >
                  {b.photo
                    ? <img src={`/images/shelf/spines/${b.photo.file}`} alt="" width={b.w} height={b.h} loading="lazy" decoding="async" draggable="false" />
                    : <span className="spine-title" aria-hidden="true">{b.title}</span>}
                </button>
              ))}
            </div>
            <div className="plank" aria-hidden="true" />
            <div className="shelf-label"><h2 id={`shelf-${gi}`}>{g.name}</h2><b>{g.books.length}</b></div>
          </section>
        ))}
      </div>

      {pick && (
        <div className="sheet" role="region" aria-label={t('shelf.selected')} aria-live="polite">
          {pick.photo
            ? <img className="sheet-spine" src={`/images/shelf/spines/${pick.photo.file}`} alt={t('shelf.spineAlt', { title: pick.title })} />
            : cover
              ? <img className="sheet-cover" src={cover} alt={t('shelf.coverAlt', { title: pick.title })}
                  onError={() => setCoverFailed(f => ({ ...f, [pick.title]: true }))} />
              : <div className="sheet-drawn" style={{ '--s': `var(--sp${pick.colour})` }} aria-hidden="true">{pick.title}</div>}
          <div>
            <p className="sheet-line">{line}</p>
            <h3 className="sheet-title">{pick.title}</h3>
            <p className="sheet-author">{t('shelf.by', { author: pick.author })}</p>
          </div>
          <button type="button" className="sheet-close" onClick={() => setSelected(null)}>{t('shelf.putBack')}</button>
        </div>
      )}
    </div>
  )
}
