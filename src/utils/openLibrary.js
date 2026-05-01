const cache = new Map()

/**
 * Returns a cover image URL for the given ISBN, or null on failure.
 * The URL is returned immediately from the CDN pattern — actual validity
 * is confirmed by the caller checking naturalWidth on the img element.
 */
export async function getCoverByISBN(isbn) {
  if (!isbn) return null
  const key = `isbn:${isbn}`
  if (cache.has(key)) return cache.get(key)
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
  cache.set(key, url)
  return url
}

/**
 * Searches Open Library by title + author and returns a cover URL, or null.
 * Uses cover_i from search results (most reliable), falls back to first ISBN.
 */
export async function getCoverByTitle(title, author) {
  if (!title) return null
  const key = `title:${title}:${author ?? ''}`
  if (cache.has(key)) return cache.get(key)
  try {
    const params = new URLSearchParams({ title, limit: '1' })
    if (author) params.set('author', author)
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) { cache.set(key, null); return null }
    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) { cache.set(key, null); return null }
    let url = null
    if (doc.cover_i) {
      url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    } else if (doc.isbn?.[0]) {
      url = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
    }
    cache.set(key, url)
    return url
  } catch {
    cache.set(key, null)
    return null
  }
}
