import { useEffect } from 'react'
import { createKonamiMatcher } from '../lib/konami'

// Calls `onMatch` whenever the Konami code is typed anywhere on the page.
export function useKonami(onMatch: () => void): void {
  useEffect(() => {
    const match = createKonamiMatcher()
    const onKey = (event: KeyboardEvent) => {
      if (!event.repeat && match(event.code)) onMatch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMatch])
}
