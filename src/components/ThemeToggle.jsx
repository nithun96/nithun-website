import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label={t('nav.toggleTheme')}
      className="w-8 h-8 flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
