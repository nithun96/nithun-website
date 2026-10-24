import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, readFileSync } from 'fs'
import { parseFrontmatter, slugFromPath } from './src/lib/parseFrontmatter.js'

// The newest post's title and slug, for the Writing card on the homepage.
// Read here (not in the page) so the posts' text doesn't end up in the main bundle.
function latestPost() {
  const dir = new URL('./src/writing/', import.meta.url)
  const posts = readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const { data } = parseFrontmatter(readFileSync(new URL(f, dir), 'utf-8'))
    return { title: data.title, slug: slugFromPath(f), date: data.date || '' }
  })
  return posts.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // YYYY-MM-DD; the footer writes it out in the reader's language
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __LATEST_POST__: JSON.stringify(latestPost()),
  },
})
