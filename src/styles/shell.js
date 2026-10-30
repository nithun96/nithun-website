// Shared page container — keeps the top bar, page content and footer aligned
// to the same left/right edges at every viewport width. Reading text inside it
// keeps its own narrower max-width (posts 780px, About 620px).
export const SHELL = {
  padding: '0 clamp(24px, 5vw, 64px)',
  maxWidth: 1200,
  margin: '0 auto',
  boxSizing: 'border-box',
}
