const cache = new Map()

// Limit concurrent Google Books requests to avoid 503 rate limiting
let activeRequests = 0
const MAX_CONCURRENT = 3
const waitQueue = []

function acquireSlot() {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++
    return Promise.resolve()
  }
  return new Promise(resolve => waitQueue.push(resolve))
}

function releaseSlot() {
  activeRequests--
  if (waitQueue.length > 0) {
    activeRequests++
    waitQueue.shift()()
  }
}

export async function getBookCover(title, author, isbn = null) {
  const cacheKey = `${title}:${author}:${isbn || ''}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    const googleCover = await tryGoogleBooks(title, author)
    if (googleCover) {
      cache.set(cacheKey, googleCover)
      return googleCover
    }

    // Fall back to direct Open Library ISBN cover (no API call, no CORS issues)
    const openLibraryCover = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : null

    cache.set(cacheKey, openLibraryCover)
    return openLibraryCover
  } catch {
    cache.set(cacheKey, null)
    return null
  }
}

async function tryGoogleBooks(title, author) {
  await acquireSlot()
  try {
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    let imageUrl = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    if (!imageUrl) return null
    imageUrl = imageUrl.replace('http://', 'https://')
    return imageUrl.replace(/zoom=\d+/, 'zoom=3')
  } catch {
    return null
  } finally {
    releaseSlot()
  }
}
