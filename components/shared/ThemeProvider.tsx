'use client'

/**
 * ThemeProvider — manages light / dark / auto theme.
 *
 * - Reads saved preference from localStorage ('squadstay_theme')
 * - Writes class="dark" to <html> immediately on mount
 * - Listens to system preference changes when theme is 'auto'
 * - Exposes useTheme() hook for reading + setting theme
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type AppTheme = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'squadstay_theme'

type ThemeCtxValue = {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

const ThemeCtx = createContext<ThemeCtxValue>({ theme: 'auto', setTheme: () => {} })

function applyTheme(t: AppTheme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = t === 'dark' || (t === 'auto' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('auto')

  // On mount, read stored preference and apply
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as AppTheme) || 'auto'
    setThemeState(stored)
    applyTheme(stored)

    // Track system preference changes when in 'auto' mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as AppTheme) || 'auto'
      if (current === 'auto') applyTheme('auto')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }, [])

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
}

export function useTheme() { return useContext(ThemeCtx) }

/**
 * Inline script string to inject into <head> — runs synchronously before
 * React hydrates to avoid a flash of the wrong theme.
 */
export const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('squadstay_theme') || 'auto';
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (t === 'dark' || (t === 'auto' && dark)) {
    document.documentElement.classList.add('dark');
  }
} catch(e) {}
`.trim()
