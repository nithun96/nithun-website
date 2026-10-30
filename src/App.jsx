import { Outlet, ScrollRestoration } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// The layout every page shares; the routes are in main.jsx
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
        <Outlet />
      </main>
      <Footer />
      {/* A new page starts at the top; Back returns to where you were */}
      <ScrollRestoration />
    </div>
  )
}
