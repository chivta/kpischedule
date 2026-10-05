// localStorage-backed stores shared by components through useStore, plus the response cache.

import { useSyncExternalStore } from 'react'
import type { OwnerKind } from '../api/types'
import type { WeekAnchor } from './time'

const STORAGE_PREFIX = 'kpis:'
const CACHE_PREFIX = `${STORAGE_PREFIX}cache:`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

// Returns false when the browser refuses the write, e.g. the quota is full.
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export interface Store<T> {
  get: () => T
  set: (value: T) => void
  subscribe: (listener: () => void) => () => void
}

// A value kept in memory, mirrored to localStorage, and synced between tabs.
function createStore<T>(name: string, initial: T): Store<T> {
  const key = STORAGE_PREFIX + name
  let value = read<T>(key) ?? initial
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  window.addEventListener('storage', (event) => {
    if (event.key !== key) return
    value = read<T>(key) ?? initial
    notify()
  })

  return {
    get: () => value,
    set: (next) => {
      value = next
      write(key, next)
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}

export type ThemeChoice = 'system' | 'light' | 'dark'
export type Locale = 'uk' | 'en'

// A group or lecturer the user can return to without searching.
export interface ScheduleRef {
  kind: OwnerKind
  id: string
  name: string
  // Faculty for a group, empty for a lecturer.
  detail: string
}

export const themeStore = createStore<ThemeChoice>('theme', 'system')
export const localeStore = createStore<Locale>('locale', 'uk')
export const savedStore = createStore<ScheduleRef[]>('saved', [])
export const lastViewedStore = createStore<ScheduleRef | null>('last-viewed', null)
export const weekAnchorStore = createStore<WeekAnchor | null>('week-anchor', null)
// When on, the week shows every pair of the timetable, including ones not held that week.
export const showAllStore = createStore<boolean>('show-all', false)

export function isSaved(saved: ScheduleRef[], ref: Pick<ScheduleRef, 'kind' | 'id'>): boolean {
  return saved.some((item) => item.kind === ref.kind && item.id === ref.id)
}

export function toggleSaved(ref: ScheduleRef): void {
  const saved = savedStore.get()
  savedStore.set(
    isSaved(saved, ref)
      ? saved.filter((item) => !(item.kind === ref.kind && item.id === ref.id))
      : [...saved, ref],
  )
}

export interface CacheEntry<T> {
  // Epoch milliseconds of the fetch.
  at: number
  data: T
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  return read<CacheEntry<T>>(CACHE_PREFIX + key)
}

// When storage is full, drops every cached response and tries once more.
export function writeCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { at: Date.now(), data }
  if (write(CACHE_PREFIX + key, entry)) return
  for (const storedKey of Object.keys(localStorage)) {
    if (storedKey.startsWith(CACHE_PREFIX)) localStorage.removeItem(storedKey)
  }
  write(CACHE_PREFIX + key, entry)
}
