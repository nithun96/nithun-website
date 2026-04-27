import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import BooksPage from './pages/BooksPage'
import WritingPage from './pages/WritingPage'
import WritingPostPage from './pages/WritingPostPage'
import SilencePage from './pages/SilencePage'

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f2ee] dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-zinc-900 focus:rounded"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/writing/:slug" element={<WritingPostPage />} />
          <Route path="/silence" element={<SilencePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
