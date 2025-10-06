'use client'

import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = (theme ?? resolvedTheme) === 'dark'
  return (
    <button
      className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/15"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}
