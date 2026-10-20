// Runs after `vite build`. Two jobs, both static files in dist/:
//
// 1. A copy of index.html for every page and post, with that page's own title,
//    description, canonical URL and Open Graph tags (dist/about.html,
//    dist/writing/context-window.html, …). Nginx serves these via
//    `try_files $uri $uri.html …`. Link previews in chat apps and on LinkedIn
//    read the HTML without running JavaScript, so without these every shared
//    link would show the homepage. The page body is still rendered by React.
//
// 2. dist/rss.xml — an RSS feed of all writing posts.
//
// When adding a new page: add it to PAGES below (and to scripts/generate-sitemap.js).

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseFrontmatter, slugFromPath } from '../src/lib/parseFrontmatter.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const SITE = 'https://nithun.no'

const en = JSON.parse(readFileSync(resolve(root, 'src/locales/en/translation.json'), 'utf-8'))
const template = readFileSync(resolve(dist, 'index.html'), 'utf-8')

// Static pages: path → translation keys under meta.* (the homepage is index.html itself)
const PAGES = [
  { path: '/writing', title: 'writingTitle', description: 'writingDescription' },
  { path: '/shelf',   title: 'shelfTitle',   description: 'shelfDescription' },
  { path: '/silence', title: 'silenceTitle', description: 'silenceDescription' },
  { path: '/about',   title: 'aboutTitle',   description: 'aboutDescription' },
]

const writingDir = resolve(root, 'src/writing')
const posts = readdirSync(writingDir)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const { data } = parseFrontmatter(readFileSync(resolve(writingDir, f), 'utf-8'))
    return { ...data, slug: data.slug || slugFromPath(f) }
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

const escape = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Replace one tag's content attribute; fail the build if the tag is missing,
// so a change to index.html can't silently break the previews.
function setAttr(html, pattern, value, label) {
  if (!pattern.test(html)) throw new Error(`prerender: ${label} not found in index.html`)
  return html.replace(pattern, (_, before, after) => `${before}${escape(value)}${after}`)
}

function pageHtml({ path, title, description, type = 'website' }) {
  const url = SITE + path
  let html = template
  html = setAttr(html, /(<title>)[^<]*(<\/title>)/, title, '<title>')
  html = setAttr(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, description, 'meta description')
  html = setAttr(html, /(<meta property="og:type" content=")[^"]*(")/, type, 'og:type')
  html = setAttr(html, /(<meta property="og:url" content=")[^"]*(")/, url, 'og:url')
  html = setAttr(html, /(<meta property="og:title" content=")[^"]*(")/, title, 'og:title')
  html = setAttr(html, /(<meta property="og:description" content=")[^"]*(")/, description, 'og:description')
  html = setAttr(html, /(<meta name="twitter:title" content=")[^"]*(")/, title, 'twitter:title')
  html = setAttr(html, /(<meta name="twitter:description" content=")[^"]*(")/, description, 'twitter:description')
  return html.replace('</head>', `  <link rel="canonical" href="${escape(url)}" />\n  </head>`)
}

function write(path, html) {
  const file = resolve(dist, `.${path}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

for (const p of PAGES) {
  write(p.path, pageHtml({ path: p.path, title: en.meta[p.title], description: en.meta[p.description] }))
}
for (const post of posts) {
  write(`/writing/${post.slug}`, pageHtml({
    path: `/writing/${post.slug}`,
    title: `${post.title} | Nithun Manoharan`,
    description: post.summary || en.meta.writingDescription,
    type: 'article',
  }))
}

// RSS 2.0 feed
const rfc822 = d => new Date(`${d}T12:00:00Z`).toUTCString()
const items = posts.map(post => `
    <item>
      <title>${escape(post.title)}</title>
      <link>${SITE}/writing/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/writing/${post.slug}</guid>
      ${post.date ? `<pubDate>${rfc822(post.date)}</pubDate>` : ''}
      <description>${escape(post.summary || '')}</description>
    </item>`).join('')

writeFileSync(resolve(dist, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nithun Manoharan — Writing</title>
    <link>${SITE}/writing</link>
    <description>${escape(en.meta.writingDescription)}</description>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`)

console.log(`Prerendered ${PAGES.length} pages and ${posts.length} posts; wrote rss.xml`)
