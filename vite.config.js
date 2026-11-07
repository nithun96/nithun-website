import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, readFileSync } from 'fs'
import { createHmac } from 'crypto'
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

// Act Natural (public/lab/act-natural/) loads PeerJS and the QR library from its own vendor/
// folder on nithun.no: its CSP only allows the site's own scripts. They're npm dependencies
// (versions in package.json), copied from node_modules into the build here and served
// straight from node_modules by the dev server, so `npm run dev` works for testing too.
const LAB_VENDOR = {
  'lab/act-natural/vendor/peerjs.min.js': ['peerjs/dist/peerjs.min.js', s => s.replace(/\/\/# sourceMappingURL=\S+\s*$/, '')],
  'lab/act-natural/vendor/qrcode.js': ['qrcode-generator/dist/qrcode.js'],
  'lab/act-natural/vendor/LICENSE-peerjs.txt': ['peerjs/LICENSE'],
}
// The relay (TURN) login for Act Natural, made fresh at each build from the secret the relay
// on the server shares (GitHub secret TURN_SECRET; see server/turn/README.md). It follows the
// TURN REST scheme coturn understands: the username holds an expiry time, the password is an
// HMAC of it, so the secret itself never reaches the page and each login stops working after
// 60 days. Without the secret (local builds) the game simply has no relay of its own.
const TURN_TTL_DAYS = 60
function turnScript() {
  const secret = process.env.TURN_SECRET
  if (!secret) return 'window.ActNatural = Object.assign(window.ActNatural || {}, { turn: null })\n'
  const expires = Math.floor(Date.now() / 1000) + TURN_TTL_DAYS * 86400
  const username = `${expires}:actnatural`
  const credential = createHmac('sha1', secret).update(username).digest('base64')
  return '// Made at build time by vite.config.js. Expires ' + new Date(expires * 1000).toISOString().slice(0, 10) + '.\n' +
    `window.ActNatural = Object.assign(window.ActNatural || {}, { turn: ${JSON.stringify({ host: 'nithun.no', username, credential, expires })} })\n`
}

function labVendor() {
  const read = ([file, fix]) => {
    const text = readFileSync(new URL(`./node_modules/${file}`, import.meta.url), 'utf-8')
    return fix ? fix(text) : text
  }
  return {
    name: 'lab-vendor',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0].replace(/^\//, '')
        if (path === 'lab/act-natural/turn.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(turnScript()) }
        if (!LAB_VENDOR[path]) return next()
        res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : 'text/plain; charset=utf-8')
        res.end(read(LAB_VENDOR[path]))
      })
    },
    generateBundle() {
      for (const [fileName, src] of Object.entries(LAB_VENDOR)) this.emitFile({ type: 'asset', fileName, source: read(src) })
      this.emitFile({ type: 'asset', fileName: 'lab/act-natural/turn.js', source: turnScript() })
    },
  }
}

export default defineConfig({
  server: {
    proxy: {
      // Act Natural's relay (MQTT broker): the one on nithun.no, as on the live site.
      // ACT_NATURAL_MQTT=ws://localhost:9001 npm run dev uses a local Mosquitto instead
      // (run it with server/mqtt/act-natural.conf; see server/mqtt/README.md).
      '/lab/act-natural/mqtt': { target: process.env.ACT_NATURAL_MQTT || 'wss://nithun.no', ws: true, changeOrigin: true },
    },
  },
  plugins: [
    posts(),
    labVendor(),
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
