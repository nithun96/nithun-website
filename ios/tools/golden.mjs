// Prints reference samples from the website's recipes, for SilenceTests.
// Usage: node tools/golden.mjs ../nithun-website/src/audio/noiseRecipes.js > tools/golden.json
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const { makeLoop } = await import(pathToFileURL(resolve(process.argv[2])).href)
const rate = 48000
const idx = [0, 1, 2, 100, 47999, 48000, 48001, 1234567, 2400000, 4799999]
const samples = {}
for (const id of ['brown', 'pink', 'rain', 'ocean']) {
  const d = makeLoop(id, rate)
  samples[id] = idx.map(i => d[i])
}
console.log(JSON.stringify({ rate, idx, samples }))
