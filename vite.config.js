import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, readFileSync } from 'fs'
import { parseFrontmatter, slugFromPath } from './src/lib/parseFrontmatter.js'
import { postToHast, postMeta } from './src/lib/markdownPost.js'

// The newest post (title, slug, date, language and optional thumbnail), for the
// Writing row on the homepage. Read here (not in the page) so the posts' text
// doesn't end up in the main bundle. The thumbnail is the post's `thumbnail`
// frontmatter (a small 4:5 image) with `thumbnailAlt`.
function latestPost() {
  const dir = new URL('./src/writing/', import.meta.url)
  const posts = readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const { data } = parseFrontmatter(readFileSync(new URL(f, dir), 'utf-8'))
    return {
      title: data.title, slug: slugFromPath(f), date: data.date || '', language: data.language || 'en',
      thumbnail: data.thumbnail || null, thumbnailAlt: data.thumbnailAlt || '',
    }
  })
  return posts.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

// Posts: `x.md?post` → { data, footnotes, hast } and `x.md?meta` → frontmatter,
// both made here at build time so visitors don't download a Markdown parser
// (see src/lib/markdownPost.js).
function posts() {
  return {
    name: 'posts',
    enforce: 'pre',
    load(id) {
      const [file, query = ''] = id.split('?')
      const params = new URLSearchParams(query)   // the dev server adds `&import`
      const kind = params.has('post') ? 'post' : params.has('meta') ? 'meta' : null
      if (!file.endsWith('.md') || !kind) return null
      this.addWatchFile(file)
      const raw = readFileSync(file, 'utf-8')
      return `export default ${JSON.stringify(kind === 'post' ? postToHast(raw) : postMeta(raw))}`
    },
  }
}

export default defineConfig({
  plugins: [
    posts(),
    react(),
    tailwindcss(),
  ],
  define: {
    // YYYY-MM-DD; the footer writes it out in the reader's language
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __LATEST_POST__: JSON.stringify(latestPost()),
    // For the Shelf row on the homepage, without loading the whole shelf there
    __BOOK_COUNT__: JSON.stringify(JSON.parse(readFileSync(new URL('./src/data/shelf.json', import.meta.url), 'utf-8')).books.length),
  },
})
