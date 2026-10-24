import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'

// Every page except the homepage is loaded on demand, so the first visit only
// downloads what it shows (the posts, Markdown renderer and Shelf data are big).
const ShelfPage = lazy(() => import('./pages/ShelfPage'))
const WritingPage = lazy(() => import('./pages/WritingPage'))
const WritingPostPage = lazy(() => import('./pages/WritingPostPage'))
const SilencePage = lazy(() => import('./pages/SilencePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  const { t } = useTranslation()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-3 focus:py-1 focus:bg-bg2 focus:text-fg focus:rounded text-xs"
      >
        {t('nav.skip')}
      </a>
      <Navbar />
      {/* min-height: the footer stays below the screen while a page loads, instead of jumping down */}
      <main id="main-content" tabIndex={-1} style={{ outline: 'none', minHeight: '100vh' }}>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/"              element={<Hero />} />
          <Route path="/writing"       element={<WritingPage />} />
          <Route path="/writing/:slug" element={<WritingPostPage />} />
          <Route path="/silence"       element={<SilencePage />} />
          <Route path="/shelf"         element={<ShelfPage />} />
          <Route path="/about"         element={<AboutPage />} />
          <Route path="/books"         element={<Navigate to="/shelf" replace />} />
          <Route path="*"              element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
