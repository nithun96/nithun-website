// Service worker: lets Silence work offline (e.g. on a plane).
//
// Not bundled by Vite. scripts/build-sw.js copies this file to dist/sw.js and
// fills in VERSION and PRECACHE. It is registered by SilencePage.jsx, so only
// people who open Silence download anything extra.
//
// - Pages: always from the network, so a deploy shows up at once. Offline, the
//   saved copy of / or /silence is used (refreshed on every online visit).
// - Built files, fonts and Silence's artwork: saved when the worker installs
//   (about 0.7 MB), then served from the cache. Built files have a content hash
//   in their name, so a cached copy is never stale.
// - Sound: Silence makes it live in the browser (src/audio/noisePlayer.js), so
//   there are no sound files to save. Until Nov 2026 it played files, which an
//   older version of this worker kept in a "sounds" cache; that cache is deleted.
//
// To turn it off: replace the body of this file with
//   self.addEventListener('install', () => self.skipWaiting())
//   self.addEventListener('activate', () => self.registration.unregister())
// and deploy; every browser drops the worker on its next visit.

/* global VERSION, PRECACHE */

const STATIC = `static-${VERSION}`
const PAGES = 'pages'
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
      if ((name.startsWith('static-') && name !== STATIC) || name === 'sounds') await caches.delete(name)
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
