import covers from '../data/bookCovers.json'

export function getBookCover(title) {
  return covers[title] ?? null
}
