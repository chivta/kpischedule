// In-memory UI state shared across the tree. Nothing here survives a reload.

import type { Store } from './storage'

function createMemoryStore<T>(initial: T): Store<T> {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next) => {
      value = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// Whether the search palette is open. The top bar, the home page and Ctrl+K all flip it.
export const searchOpenStore = createMemoryStore(false)
