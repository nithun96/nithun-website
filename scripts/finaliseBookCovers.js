import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const draftPath    = join(root, 'src/data/bookCovers.draft.json')
const overridePath = join(root, 'src/data/bookCoversOverride.json')
const outputPath   = join(root, 'src/data/bookCovers.json')

if (!existsSync(draftPath)) {
  console.error('Error: src/data/bookCovers.draft.json not found.')
  console.error('Run "npm run fetch-covers" first, then re-run this script.')
  process.exit(1)
}

const draft     = JSON.parse(readFileSync(draftPath, 'utf8'))
const overrides = JSON.parse(readFileSync(overridePath, 'utf8'))

// Build set of overridden titles (excluding the comment key)
const overrideKeys = new Set(
  Object.keys(overrides).filter(k => k !== '_comment')
)

const result = { ...draft }
let overrideCount = 0

for (const [title, url] of Object.entries(overrides)) {
  if (title === '_comment') continue
  const before = draft[title]
  result[title] = url
  overrideCount++
  if (before === undefined) {
    console.log(`+ "${title}" → added (not in draft)`)
  } else if (before === url) {
    console.log(`= "${title}" → unchanged`)
  } else {
    const fromLabel = before ? 'had cover' : 'was null'
    const toLabel   = url    ? url         : 'null (cover removed)'
    console.log(`~ "${title}" (${fromLabel}) → ${toLabel}`)
  }
}

writeFileSync(outputPath, JSON.stringify(result, null, 2))

const found   = Object.values(result).filter(v => v !== null).length
const total   = Object.keys(result).length

console.log(`\nWrote src/data/bookCovers.json: ${found}/${total} covers${overrideCount > 0 ? ` (${overrideCount} override${overrideCount > 1 ? 's' : ''} applied)` : ''}`)

// Regenerate cover-preview.html from the merged result
// Read the shelf to get author names
const shelf = JSON.parse(readFileSync(join(root, 'src/data/shelf.json'), 'utf8'))
const authorMap = {}
const shelfTitles = new Set()
for (const book of shelf.books) {
  if (!authorMap[book.title]) authorMap[book.title] = book.author
  shelfTitles.add(book.title)
}

const cards = Object.entries(result).filter(([title]) => shelfTitles.has(title)).map(([title, url]) => {
  const isOverride = overrideKeys.has(title)
  const draftUrl   = draft[title]
  const draftHad   = draftUrl != null
  let badgeClass, badgeText
  if (isOverride) {
    badgeClass = 'override'; badgeText = 'OVERRIDE'
  } else if (url) {
    // Guess source from URL
    badgeClass = url.includes('googleapis.com') || url.includes('books.google.com') ? 'google' : 'ol'
    badgeText  = badgeClass === 'google' ? 'GOOGLE' : 'OL'
  } else {
    badgeClass = 'none'; badgeText = 'MISSING'
  }

  const badge = `<span class="badge ${badgeClass}">${badgeText}</span>`
  const img = url
    ? `<img src="${url}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.parentNode.querySelector('.no-cover').style.display='flex';this.remove()">`
    : ''
  const placeholder = url ? '' : '<div class="no-cover">no cover</div>'
  const author = authorMap[title] ?? ''
  return `<div class="card">${img}${placeholder}${badge}<div class="title">${title}</div><div class="author">${author}</div></div>`
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
.badge.override { background: #3a2e10; color: #c8a040 }
.title { font-size: 11px; color: #b8b0a8; line-height: 1.4; font-family: Georgia, serif }
.author { font-size: 10px; color: #555; line-height: 1.3 }
</style>
</head>
<body>
<h1>Book Cover Preview</h1>
<p class="summary">
  <strong style="color:#e8e0d4">${found}/${total}</strong> covers &nbsp;&middot;&nbsp;
  <strong style="color:#c8a040">${overrideCount} override${overrideCount !== 1 ? 's' : ''}</strong> applied<br>
  Generated ${new Date().toISOString().slice(0, 10)}<br>
  To fix a cover: edit <code>src/data/bookCoversOverride.json</code> then run <code>npm run finalise-covers</code>
</p>
<div class="grid">
${cards}
</div>
</body>
</html>`

writeFileSync(join(root, 'cover-preview.html'), html)
console.log('Wrote cover-preview.html — refresh in browser to see updated covers')
console.log('Commit bookCovers.json and deploy when happy.')
