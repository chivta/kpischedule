import { useEffect, useState } from 'react'
import { ApiError, type ApiErrorCode } from '../api/client'
import { readCache, writeCache } from '../lib/storage'

export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

export interface QueryState<T> {
  // The cached copy shows first and is replaced when the fetch lands.
  data: T | undefined
  // Set when the latest fetch failed. `data` may still hold a cached copy.
  error: ApiErrorCode | null
  loading: boolean
  // Epoch milliseconds of the fetch that produced `data`.
  updatedAt: number | null
}

interface Snapshot<T> extends QueryState<T> {
  key: string | null
}

function initial<T>(key: string | null): Snapshot<T> {
  const cached = key === null ? null : readCache<T>(key)
  return {
    key,
    data: cached?.data,
    error: null,
    loading: key !== null,
    updatedAt: cached?.at ?? null,
  }
}

// Returns the localStorage copy at once and refetches when it is older than `maxAgeMs`.
// A failed fetch keeps the cached copy, so a saved schedule still opens offline.
// Pass a null key to skip fetching.
export function useCachedQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  maxAgeMs: number,
): QueryState<T> {
  const [state, setState] = useState<Snapshot<T>>(() => initial<T>(key))
  // A new key resets the state during render, so no frame shows the previous owner's data.
  const current = state.key === key ? state : initial<T>(key)
  if (current !== state) setState(current)

  useEffect(() => {
    if (key === null) return
    const cached = readCache<T>(key)
    if (cached && Date.now() - cached.at < maxAgeMs) {
      setState((previous) => (previous.key === key ? { ...previous, loading: false } : previous))
      return
    }
    let cancelled = false
    fetcher().then(
      (data) => {
        if (cancelled) return
        writeCache(key, data)
        setState({ key, data, error: null, loading: false, updatedAt: Date.now() })
      },
      (error: unknown) => {
        if (cancelled) return
        const code = error instanceof ApiError ? error.code : 'network'
        setState((previous) => ({ ...previous, key, error: code, loading: false }))
      },
    )
    return () => {
      cancelled = true
    }
    // The fetcher is a fresh closure on every render. The key identifies the request.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, maxAgeMs])

  return current
}
