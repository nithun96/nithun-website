import { useEffect } from 'react'

const SITE = 'https://nithun.no'

// index.html only holds the homepage's tags. Without this, every route would
// share the homepage's title, description and canonical URL, and Google could
// treat each page as a duplicate of the homepage.
function setTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function setMeta(attr, key, content) {
  setTag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute(attr, key)
    return m
  }, 'content', content)
}

export function usePageMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    const url = path === '/' ? SITE : SITE + path

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setTag('link[rel="canonical"]', () => {
      const l = document.createElement('link')
      l.rel = 'canonical'
      return l
    }, 'href', url)

    if (!noindex) return
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.appendChild(robots)
    return () => document.head.removeChild(robots)
  }, [title, description, path, noindex])
}
