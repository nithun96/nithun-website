// After vite build: writes dist/sw.js from src/sw.js (see there), with the list
// of files to save for offline use. Its VERSION changes whenever that list does,
// so each deploy replaces the old cache.

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { createHash } from 'crypto'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const list = dir => readdirSync(resolve(dist, dir)).map(f => `/${dir}/${f}`)

const precache = [
  ...list('assets'),
  ...list('fonts'),
  ...list('images/silence'),
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icon-192.png',
]
const sounds = list('sounds').filter(f => f.endsWith('.m4a'))

const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)
const source = readFileSync(resolve(root, 'src/sw.js'), 'utf-8')
  .replace('/* global VERSION, PRECACHE, SOUNDS */', [
    `const VERSION = ${JSON.stringify(version)}`,
    `const PRECACHE = ${JSON.stringify(precache)}`,
    `const SOUNDS = ${JSON.stringify(sounds)}`,
  ].join('\n'))

writeFileSync(resolve(dist, 'sw.js'), source)
console.log(`build-sw: ${precache.length} files to save offline, ${sounds.length} sounds, version ${version}`)
