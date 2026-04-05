import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'
import LangToggle from './LangToggle'

export default function Navbar() {
  const { t } = useTranslation()

  return (
    <nav aria-label="Main navigation" className="border-b border-zinc-200 dark:border-zinc-700 bg-[#ede9e4] dark:bg-zinc-800">
      <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight">
          NM
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/books" className="text-sm hover:underline underline-offset-4 active:opacity-40 transition-opacity">
            {t('nav.books')}
          </Link>
          <a href="#footer" className="text-sm hover:underline underline-offset-4 active:opacity-40 transition-opacity">
            {t('nav.contact')}
          </a>
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
