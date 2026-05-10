import { useState, useRef, useMemo, useCallback, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { parseFrontmatter, slugFromPath } from '../lib/parseFrontmatter'
import { parseFootnotes } from '../lib/parseFootnotes'

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

// ── Footnote context ──────────────────────────────────────────────────────────

const FootnoteCtx = createContext(null)

// ── FootnoteMarker (inline superscript) ───────────────────────────────────────
// Desktop: hover shows tooltip, click pins it open until clicked again.
// Mobile: click updates activeFootnote in context; FootnotePanel handles display.

function FootnoteMarker({ number, type, text }) {
  const { activeFootnote, onToggle } = useContext(FootnoteCtx)
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [below, setBelow] = useState(false)
  const wrapRef = useRef(null)
  const hideTimer = useRef(null)

  const hasHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    []
  )

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const showPanel = hasHover && (hovering || pinned)
  const supColor = pinned ? 'var(--fg2)' : 'var(--fgm)'

  function handleEnter() {
    if (!hasHover) return
    clearTimeout(hideTimer.current)
    const rect = wrapRef.current?.getBoundingClientRect()
    setBelow(rect ? rect.top < 120 : false)
    setHovering(true)
  }

  function handleLeave() {
    if (!hasHover) return
    // 200ms grace period so the tooltip doesn't vanish on a brief mouse exit
    hideTimer.current = setTimeout(() => setHovering(false), 200)
  }

  function handleClick() {
    if (hasHover) {
      setPinned(prev => !prev)
    } else {
      onToggle(number)
    }
  }

  const calloutBase = {
    background: 'var(--bg2)',
    border: '1px solid color-mix(in oklch, var(--fg) 10%, transparent)',
    ...(type === 'wry' ? { borderLeft: '2px solid var(--stone)' } : {}),
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--fgm)',
    fontStyle: 'italic',
    lineHeight: 1.55,
  }

  return (
    <span
      ref={wrapRef}
      className="fn-marker"
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <sup
        data-footnote={number}
        aria-label={`Footnote ${number}: ${text}`}
        style={{
          fontSize: 10,
          color: supColor,
          textDecorationLine: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: supColor,
          fontStyle: 'normal',
          userSelect: 'none',
          transition: 'color 0.15s ease',
        }}
      >
        {number}
      </sup>

      {/* Always in the DOM for screen readers */}
      <span className="sr-only">Footnote {number}: {text}</span>

      {/* Desktop: hover tooltip or pinned panel */}
      {showPanel && (
        <span
          role="tooltip"
          style={{
            ...calloutBase,
            display: 'block',
            position: 'absolute',
            [below ? 'top' : 'bottom']: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 280,
            width: 'max-content',
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'fn-fade 0.15s ease',
          }}
        >
          <span style={{ color: 'var(--wheat)', marginRight: 6, fontStyle: 'normal' }}>[{number}]</span>
          {text}
        </span>
      )}
    </span>
  )
}

// ── FootnotePanel (mobile bottom sheet) ──────────────────────────────────────
// Portalled to document.body so it never lives inside inline text flow.
// Slides up from the bottom when a footnote is active on touch devices.

function FootnotePanel({ footnotes }) {
  const { activeFootnote, onToggle } = useContext(FootnoteCtx)

  // Keep last-seen footnote visible while the panel is sliding away
  const lastFn = useRef(null)
  const fn = footnotes.find(f => f.number === activeFootnote)
  if (fn) lastFn.current = fn
  const displayFn = fn || lastFn.current

  const isOpen = !!fn

  return createPortal(
    <>
      {/* Invisible backdrop — tap anywhere to close */}
      <div
        aria-hidden="true"
        onClick={() => isOpen && onToggle(activeFootnote)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          display: isOpen ? 'block' : 'none',
        }}
      />

      <div
        role="complementary"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg2)',
          borderTop: displayFn?.type === 'wry'
            ? '2px solid var(--stone)'
            : '1px solid color-mix(in oklch, var(--fg) 10%, transparent)',
          padding: '20px clamp(24px, 5vw, 64px) max(28px, env(safe-area-inset-bottom))',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s ease',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 780 }}>
          <span style={{
            color: 'var(--wheat)',
            fontStyle: 'normal',
            flexShrink: 0,
            fontSize: 12,
            marginTop: 2,
          }}>
            [{displayFn?.number}]
          </span>
          <p style={{
            fontSize: 14,
            color: 'var(--fgm)',
            fontStyle: 'italic',
            lineHeight: 1.65,
            margin: 0,
            flex: 1,
          }}>
            {displayFn?.text}
          </p>
          <button
            onClick={() => isOpen && onToggle(activeFootnote)}
            aria-label="Close footnote"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fgm)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '0 0 0 12px',
              lineHeight: 1,
              flexShrink: 0,
              opacity: 0.5,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── WritingPostPage ───────────────────────────────────────────────────────────

export default function WritingPostPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const [activeFootnote, setActiveFootnote] = useState(null)

  const post = posts.find(p => p.slug === slug)

  const { body, footnotes } = useMemo(
    () => (post ? parseFootnotes(post.content) : { body: '', footnotes: [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post?.content]
  )

  const handleToggle = useCallback((num) => {
    setActiveFootnote(prev => prev === num ? null : num)
  }, [])

  const mdComponents = useMemo(() => ({
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
    sup({ id, children, ...rest }) {
      if (id?.startsWith('fnref-')) {
        const num = parseInt(id.slice(6), 10)
        const fn = footnotes.find(f => f.number === num)
        if (fn) return <FootnoteMarker number={fn.number} type={fn.type} text={fn.text} />
      }
      return <sup id={id} {...rest}>{children}</sup>
    },
  }), [footnotes])

  if (!post) return <Navigate to="/writing" replace />

  return (
    <FootnoteCtx.Provider value={{ activeFootnote, onToggle: handleToggle }}>
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
            rehypePlugins={[rehypeRaw]}
            components={mdComponents}
          >
            {body}
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

      {/* Mobile footnote panel — portalled to body, outside inline text flow */}
      <FootnotePanel footnotes={footnotes} />
    </FootnoteCtx.Provider>
  )
}
