'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const mode = (theme ?? resolvedTheme) as 'light' | 'dark' | undefined
  const isDark = mode === 'dark'
  if (!mounted) {
    // Neutral placeholder slider (no theme-specific icon/text) to avoid flicker
    return (
      <span
        className="relative inline-flex items-center rounded-full border text-[11px] leading-none select-none overflow-hidden
                   h-8 w-32 px-2 bg-white text-black border-black/15 shadow-sm dark:bg-white/10 dark:text-white dark:border-white/20"
        aria-hidden
      >
        <span className="absolute left-1 top-1 h-6 w-[calc(50%-4px)] rounded-full bg-amber-500 dark:bg-amber-300" />
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Toggle theme"
      aria-label="Toggle dark mode"
      role="switch"
      aria-checked={isDark}
  className="relative inline-flex items-center rounded-full border text-[11px] font-medium leading-none select-none overflow-hidden
         h-8 w-32 px-2
                 bg-white text-black border-black/15 shadow-sm hover:bg-black/5
         dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white/15
         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 dark:focus-visible:ring-amber-300/40"
    >
      {/* Active label on left (Light) - visible only in light mode */}
      <span
        className={"pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 whitespace-nowrap transition-opacity " + (!isDark ? 'opacity-100' : 'opacity-0 hidden')}
        aria-hidden={isDark}
      >
        <Sun className="h-3.5 w-3.5 text-white" />
        <span className="text-white">Light</span>
      </span>
      {/* Active label on right (Dark) - visible only in dark mode */}
      <span
        className={"pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 whitespace-nowrap transition-opacity " + (isDark ? 'opacity-100' : 'opacity-0 hidden')}
        aria-hidden={!isDark}
      >
        <span className="text-black">Dark</span>
        <Moon className="h-3.5 w-3.5 text-black" />
      </span>
      {/* Sliding knob below labels */}
      <span
        aria-hidden
        className={"absolute top-1 left-1 h-6 w-[calc(50%-4px)] rounded-full transition-transform duration-200 z-0 " +
          (isDark ? "translate-x-[calc(100%+4px)] bg-amber-300" : "translate-x-0 bg-amber-500")}
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
      />
    </button>
  )
}
