// Runs at the end of `npm run build` and stops the build (exit code 1) if the
// site has drifted out of step with itself:
//
// 1. Translations: src/locales/en and no have exactly the same keys.
// 2. Pages: every route in src/main.jsx has its own per-page HTML in dist/
//    (so it is in PAGES in scripts/prerender.js; without it the live site
//    returns 404) and is listed in the sitemap.
// 3. Files: every /images or /fonts path (and the root icons) named in
//    src/, index.html and the manifest exists in public/. A path built from a
//    variable (`/images/about/${name}.webp`) must match at least one
//    file. Every spine photo in src/data/bookSpines.json exists.
// 4. JSON-LD in every generated HTML page parses.
//
// It only reads files; it never changes anything.

import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { resolve, dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const pub = resolve(root, 'public')
const problems = new Set()
const read = p => readFileSync(resolve(root, p), 'utf-8')

// Every file under a folder, as paths relative to root
const walk = dir => readdirSync(resolve(root, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])

// 1. Translations
const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])
const en = new Set(keys(JSON.parse(read('src/locales/en/translation.json'))))
const no = new Set(keys(JSON.parse(read('src/locales/no/translation.json'))))
for (const k of en) if (!no.has(k)) problems.add(`Translation "${k}" is in en but not in no`)
for (const k of no) if (!en.has(k)) problems.add(`Translation "${k}" is in no but not in en`)

// 2. Pages: static routes (not :params, not *, not redirects)
const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf-8')
const routes = [...read('src/main.jsx').matchAll(/path:\s*'([^']*)'\s*,\s*lazy:/g)]
  .map(m => m[1]).filter(p => !p.includes(':') && p !== '*')
for (const r of routes) {
  const path = r === '/' ? '' : `/${r.replace(/^\//, '')}`
  const html = path ? `${path.slice(1)}.html` : 'index.html'
  if (!existsSync(resolve(dist, html))) {
    problems.add(`Page "/${path.slice(1)}" has no dist/${html}: add it to PAGES in scripts/prerender.js`)
  }
  if (!new RegExp(`<loc>https://nithun\\.no${path}/?</loc>`).test(sitemap)) {
    problems.add(`Page "/${path.slice(1)}" is not in the sitemap: add it to scripts/generate-sitemap.js`)
  }
}

// 3. Files
const sources = [
  ...walk('src').filter(f => /\.(jsx?|css|json|md)$/.test(f)),
  'index.html',
  'public/manifest.webmanifest',
]
const pathRe = /(?<=["'`(\s=]|https:\/\/nithun\.no)\/(?:(?:images|fonts|sounds)\/(?:[\w\-./]|\$\{[^}]*\})+|(?:favicon|apple-touch-icon|icon-[\w-]+|manifest)\.(?:svg|png|webmanifest))/g
const escapeRe = s => s.replace(/[.*+?^()|[\]\\]/g, '\\$&')
for (const file of sources) {
  for (const [ref] of read(file).matchAll(pathRe)) {
    const path = ref.replace(/[.,]+$/, '')
    if (!path.includes('${')) {
      if (!existsSync(join(pub, path))) problems.add(`${file}: ${path} doesn't exist in public/`)
      continue
    }
    // Built from a variable: at least one file in that folder must match
    const dir = path.slice(0, path.lastIndexOf('/', path.indexOf('${')) + 1)
    const pattern = new RegExp(`^${escapeRe(path).replace(/\$\{[^}]*\}/g, '.+')}$`)
    const found = existsSync(join(pub, dir)) && statSync(join(pub, dir)).isDirectory() &&
      walk(join('public', dir)).some(f => pattern.test(`/${relative('public', f)}`))
    if (!found) problems.add(`${file}: no file in public/ matches ${path}`)
  }
}
const spines = JSON.parse(read('src/data/bookSpines.json'))
for (const [title, { file }] of Object.entries(spines)) {
  if (!existsSync(join(pub, 'images/shelf/spines', file))) {
    problems.add(`bookSpines.json: spine for "${title}" (${file}) doesn't exist`)
  }
}

// 4. JSON-LD in the generated pages
for (const file of walk('dist').filter(f => f.endsWith('.html'))) {
  for (const [, json] of read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json) } catch (e) { problems.add(`${file}: JSON-LD doesn't parse (${e.message})`) }
  }
}

if (problems.size) {
  console.error(`\ncheck-site: ${problems.size} problem(s) — the build stops here:\n` +
    [...problems].map(p => `  - ${p}`).join('\n') + '\n')
  process.exit(1)
}
console.log(`check-site: ${en.size} translations, ${routes.length} pages and all file paths in step`)
