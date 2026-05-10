const cache = new Map()

/**
 * Fetch a book cover from Google Books API (primary) or Open Library (fallback).
 * No API key required. Never throws; returns null on any failure.
 * Results are cached to avoid duplicate requests.
 */
export async function getBookCover(title, author, isbn = null) {
  const cacheKey = `${title}:${author}:${isbn || ''}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    // Try Google Books API first — faster and often has better thumbnails
    const googleCover = await tryGoogleBooks(title, author)
    if (googleCover) {
      cache.set(cacheKey, googleCover)
      return googleCover
    }

    // Fall back to Open Library
    let openLibraryCover = null
    if (isbn) {
      openLibraryCover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    } else if (author) {
      openLibraryCover = await tryOpenLibrarySearch(title, author)
    }

    cache.set(cacheKey, openLibraryCover)
    return openLibraryCover
  } catch {
    cache.set(cacheKey, null)
    return null
  }
}

async function tryGoogleBooks(title, author) {
  try {
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    let imageUrl = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    if (!imageUrl) return null
    // Google returns http:// URLs — upgrade to https to avoid mixed-content blocking
    imageUrl = imageUrl.replace('http://', 'https://')
    // Upscale from zoom=1 to zoom=3 for better resolution
    return imageUrl.replace(/zoom=\d+/, 'zoom=3')
  } catch {
    return null
  }
}

async function tryOpenLibrarySearch(title, author) {
  try {
    const params = new URLSearchParams({ title, author, limit: '1' })
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) return null

    if (doc.cover_i) {
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    } else if (doc.isbn?.[0]) {
      return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
    }

    return null
  } catch {
    return null
  }
}
