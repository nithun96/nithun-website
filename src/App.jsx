import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import ShelfPage from './pages/ShelfPage'
import WritingPage from './pages/WritingPage'
import WritingPostPage from './pages/WritingPostPage'
import SilencePage from './pages/SilencePage'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/"              element={<Hero />} />
          <Route path="/writing"       element={<WritingPage />} />
          <Route path="/writing/:slug" element={<WritingPostPage />} />
          <Route path="/silence"       element={<SilencePage />} />
          <Route path="/shelf"         element={<ShelfPage />} />
          <Route path="/books"         element={<Navigate to="/shelf" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
