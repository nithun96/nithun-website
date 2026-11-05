import { useState, useRef, useMemo, useCallback, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { slugFromPath } from '../lib/parseFrontmatter'
import { usePageMeta } from '../lib/usePageMeta'

// Each post arrives as a ready-made tree, turned from Markdown at build time
// (the `posts` plugin in vite.config.js, src/lib/markdownPost.js)
const postFiles = import.meta.glob('../writing/*.md', { query: '?post', import: 'default', eager: true })

const posts = Object.entries(postFiles).map(([path, { data, footnotes, hast }]) => (
  { ...data, slug: slugFromPath(path), footnotes, hast }
))

function formatDate(dateStr, locale) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(locale === 'no' ? 'nb-NO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function LanguagePill({ lang }) {
  const isNo = lang === 'no'
  return <span className={isNo ? 'lang-pill is-no' : 'lang-pill'}>{isNo ? 'NO' : 'EN'}</span>
}


// ── Footnote context ──────────────────────────────────────────────────────────

const FootnoteCtx = createContext(null)

// ── FootnoteMarker (inline superscript) ───────────────────────────────────────
// Desktop: hover shows tooltip, click pins it open until clicked again.
// Mobile: click updates activeFootnote in context; FootnotePanel handles display.

function FootnoteMarker({ number, type, text }) {
  const { t } = useTranslation()
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

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    } else if (e.key === 'Escape') {
      setPinned(false)
      setHovering(false)
      if (activeFootnote === number) onToggle(number)
    }
  }

  return (
    <span
      ref={wrapRef}
      className={pinned ? 'fn-marker is-pinned' : 'fn-marker'}
      role="button"
      tabIndex={0}
      aria-expanded={showPanel || activeFootnote === number}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <sup data-footnote={number}>{number}</sup>

      {/* Always in the DOM for screen readers */}
      <span className="sr-only">{t('writing.footnote')} {number}: {text}</span>

      {/* Desktop: hover tooltip or pinned panel */}
      {showPanel && (
        <span role="tooltip" className={['fn-tip', below && 'is-below', type === 'wry' && 'is-wry'].filter(Boolean).join(' ')}>
          <span className="fn-num">[{number}]</span>
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
  const { t } = useTranslation()
  const { activeFootnote, onToggle } = useContext(FootnoteCtx)
  const closeRef = useRef(null)
  const returnFocusRef = useRef(null)

  // Keep last-seen footnote visible while the panel is sliding away.
  // State updated during render (React's pattern for deriving from props),
  // since refs must not be read while rendering.
  const fn = footnotes.find(f => f.number === activeFootnote)
  const [lastFn, setLastFn] = useState(null)
  if (fn && fn !== lastFn) setLastFn(fn)
  const displayFn = fn || lastFn

  const isOpen = !!fn

  useEffect(() => {
    if (!isOpen) return
    returnFocusRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onToggle(activeFootnote) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      returnFocusRef.current?.focus?.()
    }
  }, [isOpen, activeFootnote, onToggle])

  return createPortal(
    <>
      {/* Invisible backdrop — tap anywhere to close */}
      <div
        aria-hidden="true"
        onClick={() => isOpen && onToggle(activeFootnote)}
        className={isOpen ? 'fn-backdrop is-open' : 'fn-backdrop'}
      />

      <div
        role="dialog"
        aria-label={t('writing.footnote')}
        aria-hidden={!isOpen}
        className={['fn-panel', isOpen && 'is-open', displayFn?.type === 'wry' && 'is-wry'].filter(Boolean).join(' ')}
      >
        <div className="fn-panel-row">
          <span className="fn-panel-num">[{displayFn?.number}]</span>
          <p className="fn-panel-text">{displayFn?.text}</p>
          <button
            ref={closeRef}
            onClick={() => isOpen && onToggle(activeFootnote)}
            aria-label={t('writing.closeFootnote')}
            className="fn-panel-close"
          >
            ✕
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── ImageLightbox (full-screen photo view) ───────────────────────────────────
// Opens when a photo in a post is clicked. Shows the full-resolution file
// (data-full on the <img>) if there is one. Click anywhere or press Escape to close.

function ImageLightbox({ image, onClose }) {
  const { t } = useTranslation()
  const closeRef = useRef(null)

  useEffect(() => {
    const returnFocus = document.activeElement
    closeRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      returnFocus?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      className="lightbox"
    >
      <img src={image.src} alt={image.alt} />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t('writing.closeImage')}
        className="lightbox-close"
      >
        ✕
      </button>
    </div>,
    document.body
  )
}

// ── WritingPostPage ───────────────────────────────────────────────────────────

export default function WritingPostPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const [activeFootnote, setActiveFootnote] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const closeLightbox = useCallback(() => setLightbox(null), [])

  const post = posts.find(p => p.slug === slug)

  usePageMeta({
    title: post ? `${post.title} | Nithun Manoharan` : t('meta.writingTitle'),
    description: post?.summary || t('meta.writingDescription'),
    path: post ? `/writing/${post.slug}` : '/writing',
  })

  const footnotes = useMemo(() => post?.footnotes ?? [], [post])

  const handleToggle = useCallback((num) => {
    setActiveFootnote(prev => prev === num ? null : num)
  }, [])

  const mdComponents = useMemo(() => ({
    p: ({ children }) => <p className="wp-p">{children}</p>,
    h2: ({ children }) => <h2 className="wp-h2">{children}</h2>,
    blockquote: ({ children }) => <blockquote className="wp-quote">{children}</blockquote>,
    a: ({ href, children }) => <a href={href} className="wp-link">{children}</a>,
    sup({ id, children, ...rest }) {
      if (id?.startsWith('fnref-')) {
        const num = parseInt(id.slice(6), 10)
        const fn = footnotes.find(f => f.number === num)
        if (fn) return <FootnoteMarker number={fn.number} type={fn.type} text={fn.text} />
      }
      return <sup id={id} {...rest}>{children}</sup>
    },
    // Photos in posts: click to open full screen (see ImageLightbox)
    // eslint-disable-next-line no-unused-vars
    img({ node, src, alt, 'data-full': full, ...rest }) {
      return (
        <button
          type="button"
          onClick={() => setLightbox({ src: full || src, alt })}
          aria-label={t('writing.openImage', { alt })}
          className="wp-img"
        >
          <img src={src} alt={alt} {...rest} />
        </button>
      )
    },
  }), [footnotes, t])

  // Same options react-markdown used, so the components above get the same props
  const article = useMemo(() => post && toJsxRuntime(post.hast, {
    Fragment, jsx, jsxs, components: mdComponents, ignoreInvalidStyle: true, passKeys: true, passNode: true,
  }), [post, mdComponents])

  if (!post) return <Navigate to="/writing" replace />

  return (
    <FootnoteCtx.Provider value={{ activeFootnote, onToggle: handleToggle }}>
      <div className="page-enter shell">
        {/* Post header */}
        <div className="wp-head">
          <Link to="/writing" viewTransition className="wp-back">
            ← {t('writing.backWriting')}
          </Link>

          <h1 lang={post.language || 'en'} className="wp-title">
            {post.title}
          </h1>

          <div className="wp-meta">
            {post.date && <span>{formatDate(post.date, i18n.language)}</span>}
            <LanguagePill lang={post.language || 'en'} />
            {post.readTime && <><span className="wp-sep">·</span><span>{post.readTime}</span></>}
            {post.tags && post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
              <span key={tag}><span className="wp-tag-sep">·</span>{tag}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="post-body" lang={post.language || 'en'}>
          {article}
        </div>

        {/* Spotify embed */}
        {post.spotify && post.spotify.trim() && (
          <div className="wp-spotify">
            <p>{t('writing.spotifyCaption')}</p>
            <iframe
              src={`https://open.spotify.com/embed/playlist/${post.spotify.split('/').pop().split('?')[0]}`}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={t('writing.spotifyTitle')}
            />
          </div>
        )}

        {/* Footer */}
        <div className="wp-foot">
          {post.tags && (
            <div className="flex flex-wrap gap-2">
              {post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="wp-tag">{tag}</span>
              ))}
            </div>
          )}
          {post.mastodon && (
            <a
              href={post.mastodon}
              target="_blank"
              rel="noopener noreferrer"
              className="wp-mastodon"
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
      {lightbox && <ImageLightbox image={lightbox} onClose={closeLightbox} />}
    </FootnoteCtx.Provider>
  )
}
