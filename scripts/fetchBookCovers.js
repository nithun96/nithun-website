import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const MAX_CONCURRENT = 3
const DELAY_MS = 500
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? ''

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function validateImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000) return false
    const meta = await sharp(buf).metadata()
    return (meta.width ?? 0) >= 200
  } catch {
    return false
  }
}

async function tryGoogle(title, author) {
  const keyPart = API_KEY ? `&key=${API_KEY}` : ''
  const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1${keyPart}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    let img = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    if (!img) return null
    img = img.replace('http://', 'https://').replace(/zoom=\d+/, 'zoom=3')
    return (await validateImage(img)) ? img : null
  } catch {
    return null
  }
}

async function tryOpenLibrary(title, author) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const data = await res.json()
    const coverId = data.docs?.[0]?.cover_i
    if (!coverId) return null
    const img = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    return (await validateImage(img)) ? img : null
  } catch {
    return null
  }
}

async function fetchOne(book, idx, total) {
  const num = String(idx + 1).padStart(String(total).length)
  const label = `[${num}/${total}] ${book.title}`

  let url = await tryGoogle(book.title, book.author)
  let source = 'google'

  if (!url) {
    url = await tryOpenLibrary(book.title, book.author)
    source = 'openlibrary'
  }

  if (url) {
    console.log(`${label} — ✓ ${source}`)
  } else {
    console.log(`${label} — ✗ not found`)
    source = 'none'
  }

  return { title: book.title, author: book.author, url: url ?? null, source }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const shelf = JSON.parse(readFileSync(join(root, 'src/data/shelf.json'), 'utf8'))

const seen = new Set()
const books = shelf.books.filter(b => {
  if (seen.has(b.title)) return false
  seen.add(b.title)
  return true
})

console.log(`Fetching covers for ${books.length} books...`)
if (API_KEY) console.log('Google Books API key detected — higher quota active')
console.log()

const allResults = []

for (let i = 0; i < books.length; i += MAX_CONCURRENT) {
  const batch = books.slice(i, i + MAX_CONCURRENT)
  const results = await Promise.all(batch.map((b, j) => fetchOne(b, i + j, books.length)))
  allResults.push(...results)
  if (i + MAX_CONCURRENT < books.length) await sleep(DELAY_MS)
}

// Write draft JSON
const draft = Object.fromEntries(allResults.map(r => [r.title, r.url]))
writeFileSync(join(root, 'src/data/bookCovers.draft.json'), JSON.stringify(draft, null, 2))

// Summary
const found   = allResults.filter(r => r.url).length
const google  = allResults.filter(r => r.source === 'google').length
const ol      = allResults.filter(r => r.source === 'openlibrary').length
const missing = allResults.filter(r => !r.url).length

console.log(`\n✓ ${found}/${books.length} covers found  (${google} Google · ${ol} Open Library · ${missing} missing)`)
console.log('Wrote src/data/bookCovers.draft.json')

// Generate HTML preview
const cards = allResults.map(r => {
  const badge = r.source === 'google'
    ? '<span class="badge google">GOOGLE</span>'
    : r.source === 'openlibrary'
      ? '<span class="badge ol">OL</span>'
      : '<span class="badge none">MISSING</span>'
  const img = r.url
    ? `<img src="${r.url}" alt="${r.title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.parentNode.querySelector('.no-cover').style.display='flex';this.remove()">`
    : ''
  const placeholder = r.url ? '' : '<div class="no-cover">no cover</div>'
  return `<div class="card">${img}${placeholder}${badge}<div class="title">${r.title}</div><div class="author">${r.author}</div></div>`
}).join('\n')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Book Cover Preview</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0 }
body { background: #111; color: #ccc; font-family: system-ui, sans-serif; padding: 32px }
h1 { font-family: Georgia, serif; font-weight: normal; font-size: 22px; color: #e8e0d4; margin-bottom: 6px }
.summary { font-size: 13px; color: #777; margin-bottom: 32px; line-height: 1.8 }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 20px 14px }
.card { display: flex; flex-direction: column; gap: 5px; position: relative }
.card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 3px; display: block; background: #1e1e1e; border: 1px solid #222 }
.no-cover { width: 100%; aspect-ratio: 2/3; background: #181818; border: 1px solid #222; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #3a3a3a }
.badge { position: absolute; top: 5px; right: 5px; font-size: 9px; letter-spacing: .05em; padding: 2px 5px; border-radius: 2px; font-weight: 700 }
.badge.google { background: #1e3a1e; color: #72a872 }
.badge.ol { background: #1e2e3e; color: #6aa0c8 }
.badge.none { background: #2e1e1e; color: #a86060 }
.title { font-size: 11px; color: #b8b0a8; line-height: 1.4; font-family: Georgia, serif }
.author { font-size: 10px; color: #555; line-height: 1.3 }
</style>
</head>
<body>
<h1>Book Cover Preview</h1>
<p class="summary">
  <strong style="color:#e8e0d4">${found}/${books.length}</strong> covers found &nbsp;&middot;&nbsp;
  <strong style="color:#72a872">${google} Google</strong> &nbsp;&middot;&nbsp;
  <strong style="color:#6aa0c8">${ol} Open Library</strong> &nbsp;&middot;&nbsp;
  <strong style="color:#a86060">${missing} missing</strong><br>
  Generated ${new Date().toISOString().slice(0, 10)}<br>
  To fix a cover: edit <code>src/data/bookCoversOverride.json</code> then run <code>npm run finalise-covers</code>
</p>
<div class="grid">
${cards}
</div>
</body>
</html>`

writeFileSync(join(root, 'cover-preview.html'), html)
console.log('Wrote cover-preview.html — open in browser to review covers')
