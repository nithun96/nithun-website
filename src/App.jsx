import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import ShelfPage from './pages/ShelfPage'
import WritingPage from './pages/WritingPage'
import WritingPostPage from './pages/WritingPostPage'
import SilencePage from './pages/SilencePage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

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
      <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
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
      </main>
      <Footer />
    </div>
  )
}
