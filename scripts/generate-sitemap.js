import { writeFileSync, readdirSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const today = new Date().toISOString().split('T')[0]

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-/, '')
}

function parseDateFromFrontmatter(raw) {
  const match = raw.match(/^---[\s\S]*?^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?/m)
  return match ? match[1] : today
}

// Photos of Nithun, listed so Google finds them even though the pages are rendered
// by JavaScript. Only photos of him go here; other images are kept out of image
// search by Nginx (see the robots map in nginx/nithun-website).
const IMAGES = {
  'https://nithun.no': [
    '/images/about/nithun-portrait-sm.webp',
    '/images/about/nithun-headshot-sm.webp',
    '/images/about/nithun-flower-field-sm.webp',
  ],
  'https://nithun.no/about': [
    '/images/about/nithun-portrait.webp',
    '/images/about/nithun-flower-field.webp',
  ],
}

function urlBlock(loc, lastmod, changefreq, priority) {
  const images = (IMAGES[loc] || [])
    .map(path => `\n    <image:image><image:loc>https://nithun.no${path}</image:loc></image:image>`)
    .join('')
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${images}
  </url>`
}

const writingDir = resolve(__dirname, '../src/writing')
const postBlocks = readdirSync(writingDir)
  .filter(f => f.endsWith('.md'))
  .map(filename => {
    const raw = readFileSync(resolve(writingDir, filename), 'utf-8')
    const slug = slugFromFilename(filename)
    const date = parseDateFromFrontmatter(raw)
    return urlBlock(`https://nithun.no/writing/${slug}`, date, 'never', '0.6')
  })
  .join('')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlock('https://nithun.no', today, 'monthly', '1.0')}
${urlBlock('https://nithun.no/writing', today, 'weekly', '0.8')}
${urlBlock('https://nithun.no/shelf', today, 'monthly', '0.7')}
${urlBlock('https://nithun.no/silence', today, 'monthly', '0.7')}
${urlBlock('https://nithun.no/about', today, 'monthly', '0.7')}
${postBlocks}
</urlset>
`

writeFileSync(resolve(__dirname, '../public/sitemap.xml'), sitemap)
console.log(`Sitemap generated with lastmod: ${today}`)
