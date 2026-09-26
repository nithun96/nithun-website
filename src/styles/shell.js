// Shared page container — keeps Navbar, page content, and Footer aligned to
// the same left/right edges at every viewport width. 780px matches the
// content column width now that the hero portrait (and its reserved space)
// has been removed.
export const SHELL = {
  padding: '0 clamp(24px, 5vw, 80px)',
  maxWidth: 780,
  margin: '0 auto',
}
