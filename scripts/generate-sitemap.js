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

function urlBlock(loc, lastmod, changefreq, priority) {
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="no" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
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
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlock('https://nithun.no', today, 'monthly', '1.0')}
${urlBlock('https://nithun.no/writing', today, 'weekly', '0.8')}
${urlBlock('https://nithun.no/shelf', today, 'monthly', '0.7')}
${urlBlock('https://nithun.no/silence', today, 'monthly', '0.7')}
${postBlocks}
</urlset>
`

writeFileSync(resolve(__dirname, '../public/sitemap.xml'), sitemap)
console.log(`Sitemap generated with lastmod: ${today}`)
