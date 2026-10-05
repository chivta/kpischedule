import { useEffect, useState } from 'react'
import { kyivClock, type KyivClock } from '../lib/time'

export const CLOCK_TICK_MS = 1000

// The current Kyiv wall clock, refreshed every `intervalMs` and when the tab becomes visible.
export function useKyivClock(intervalMs: number = CLOCK_TICK_MS): KyivClock {
  const [clock, setClock] = useState(() => kyivClock(new Date()))

  useEffect(() => {
    const update = () => setClock(kyivClock(new Date()))
    const timer = window.setInterval(update, intervalMs)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])

  return clock
}
