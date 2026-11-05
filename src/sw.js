// Service worker: lets Silence work offline (e.g. on a plane).
//
// Not bundled by Vite. scripts/build-sw.js copies this file to dist/sw.js and
// fills in VERSION, PRECACHE and SOUNDS. It is registered by SilencePage.jsx, so
// only people who open Silence download anything extra.
//
// - Pages: always from the network, so a deploy shows up at once. Offline, the
//   saved copy of / or /silence is used (refreshed on every online visit).
// - Built files, fonts and Silence's artwork: saved when the worker installs
//   (about 0.7 MB), then served from the cache. Built files have a content hash
//   in their name, so a cached copy is never stale.
// - Sounds: each file is saved the first time it plays (3.7 MB each), then
//   played from the cache. Audio asks for byte ranges, so cached sounds are
//   answered with the requested slice (status 206), which iPhones need.
//
// To turn it off: replace the body of this file with
//   self.addEventListener('install', () => self.skipWaiting())
//   self.addEventListener('activate', () => self.registration.unregister())
// and deploy; every browser drops the worker on its next visit.

/* global VERSION, PRECACHE, SOUNDS */

const STATIC = `static-${VERSION}`
const PAGES = 'pages'
const SOUND_CACHE = 'sounds'
const OFFLINE_PAGES = ['/', '/silence']

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await (await caches.open(STATIC)).addAll(PRECACHE)
    await (await caches.open(PAGES)).addAll(OFFLINE_PAGES)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('static-') && name !== STATIC) await caches.delete(name)
    }
    // Drop sounds that are no longer on the site (a changed sound gets a new name)
    const sounds = await caches.open(SOUND_CACHE)
    for (const req of await sounds.keys()) {
      if (!SOUNDS.includes(new URL(req.url).pathname)) await sounds.delete(req)
    }
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(page(request, url.pathname))
  } else if (url.pathname.startsWith('/sounds/')) {
    event.respondWith(sound(request, url.pathname, event))
  } else if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then(hit => hit || fetch(request)))
  }
})

async function page(request, path) {
  try {
    const response = await fetch(request)
    if (response.ok && OFFLINE_PAGES.includes(path)) {
      const copy = response.clone()
      caches.open(PAGES).then(cache => cache.put(path, copy))
    }
    return response
  } catch (error) {
    const cache = await caches.open(PAGES)
    const saved = await cache.match(path) || await cache.match('/')
    if (saved) return saved
    throw error
  }
}

const saving = new Set()

async function sound(request, path, event) {
  const cache = await caches.open(SOUND_CACHE)
  const hit = await cache.match(path)
  if (hit) return slice(hit, request.headers.get('range'))

  // Save the whole file in the background; this play goes to the network as usual
  if (SOUNDS.includes(path) && !saving.has(path)) {
    saving.add(path)
    event.waitUntil(
      fetch(path)
        .then(response => { if (response.status === 200) return cache.put(path, response) })
        .catch(() => {})
        .finally(() => saving.delete(path))
    )
  }
  return fetch(request)
}

// Answer "Range: bytes=start-end" from a saved file
async function slice(response, range) {
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range)
  if (!match) return response
  const blob = await response.blob()
  const size = blob.size
  let start = match[1] === '' ? size - Number(match[2]) : Number(match[1])
  let end = match[1] === '' || match[2] === '' ? size - 1 : Number(match[2])
  start = Math.max(0, start)
  end = Math.min(end, size - 1)
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  })
}
