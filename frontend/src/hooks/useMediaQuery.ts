import { useSyncExternalStore } from 'react'
import { breakpoint } from '../theme'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    () => window.matchMedia(query).matches,
  )
}

// True on phones and narrow tablets, where the week shows one day at a time.
export function useIsCompact(): boolean {
  return useMediaQuery(`(max-width: ${breakpoint.compact - 1}px)`)
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
