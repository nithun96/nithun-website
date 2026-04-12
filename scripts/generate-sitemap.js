import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const today = new Date().toISOString().split('T')[0]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <url>
    <loc>https://nithun.no</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://nithun.no"/>
    <xhtml:link rel="alternate" hreflang="no" href="https://nithun.no"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://nithun.no"/>
  </url>

  <url>
    <loc>https://nithun.no/books</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://nithun.no/books"/>
    <xhtml:link rel="alternate" hreflang="no" href="https://nithun.no/books"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://nithun.no/books"/>
  </url>

</urlset>
`

writeFileSync(resolve(__dirname, '../public/sitemap.xml'), sitemap)
console.log(`Sitemap generated with lastmod: ${today}`)
