import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'
import LangToggle from './LangToggle'

export default function Navbar() {
  const { t } = useTranslation()

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-700 bg-[#ede9e4]/80 dark:bg-zinc-800/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
          NM
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/writing" className="text-sm hover:underline underline-offset-4 active:opacity-40 transition-opacity">
            {t('writing.heading')}
          </Link>
          <Link to="/silence" className="text-sm hover:underline underline-offset-4 active:opacity-40 transition-opacity">
            {t('silence.navLink')}
          </Link>
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
