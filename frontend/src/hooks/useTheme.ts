import { useEffect } from 'react'
import { themeStore, useStore } from '../lib/storage'
import { useMediaQuery } from './useMediaQuery'

export type ResolvedTheme = 'light' | 'dark'

// The theme in effect, with "system" resolved against the OS setting.
export function useResolvedTheme(): ResolvedTheme {
  const choice = useStore(themeStore)
  const systemLight = useMediaQuery('(prefers-color-scheme: light)')
  if (choice === 'system') return systemLight ? 'light' : 'dark'
  return choice
}

// Mirrors the theme onto <html data-theme>, which the CSS variables key off. Call once, in App.
export function useApplyTheme(): ResolvedTheme {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return theme
}
