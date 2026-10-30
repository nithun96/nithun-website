import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './i18n'
import './styles/global.css'
import App from './App.jsx'
import Hero from './sections/Hero'

// Every page except the homepage is loaded on demand, so the first visit only
// downloads what it shows (the posts, Markdown renderer and Shelf data are big).
// A "data router" loads the next page before switching to it, which is what lets
// links animate between pages (viewTransition) without flashing an empty page.
const page = load => async () => ({ Component: (await load()).default })

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    HydrateFallback: () => null,
    children: [
      { index: true,           element: <Hero /> },
      { path: 'writing',       lazy: page(() => import('./pages/WritingPage')) },
      { path: 'writing/:slug', lazy: page(() => import('./pages/WritingPostPage')) },
      { path: 'silence',       lazy: page(() => import('./pages/SilencePage')) },
      { path: 'shelf',         lazy: page(() => import('./pages/ShelfPage')) },
      { path: 'about',         lazy: page(() => import('./pages/AboutPage')) },
      { path: 'books',         element: <Navigate to="/shelf" replace /> },
      { path: '*',             lazy: page(() => import('./pages/NotFoundPage')) },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
