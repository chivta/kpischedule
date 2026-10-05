import type { ApiGroup, ApiLecturer } from '../api/types'

const COLLATION_LOCALE = 'uk'
const IGNORED_CHARS = /[\s\-.'’ʼ`]/g

// Latin letters that look like Cyrillic ones, so "IO-51" on a Latin keyboard finds "ІО-51".
const LATIN_LOOKALIKES: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  e: 'е',
  h: 'н',
  i: 'і',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  x: 'х',
  y: 'у',
}

// Lower rank is a better match.
const RANK_EXACT = 0
const RANK_PREFIX = 1
const RANK_PART_PREFIX = 2
const RANK_SUBSTRING = 3

interface Indexed<T> {
  item: T
  // The whole name normalized, e.g. "іо51".
  full: string
  // Normalized words after the first one, for matching a given name or patronymic.
  laterParts: string[]
}

export interface SearchResult {
  groups: ApiGroup[]
  lecturers: ApiLecturer[]
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(IGNORED_CHARS, '')
    .replace(/[a-z]/g, (letter) => LATIN_LOOKALIKES[letter] ?? letter)
}

function index<T extends { name: string }>(items: T[]): Indexed<T>[] {
  return items.map((item) => {
    const parts = item.name.split(/\s+/).map(normalizeText)
    return { item, full: parts.join(''), laterParts: parts.slice(1) }
  })
}

// Normalized directories, built once per array identity because the search runs on every keystroke.
const indexCache = new WeakMap<object, Indexed<{ name: string }>[]>()

function indexOf<T extends { name: string }>(items: T[]): Indexed<T>[] {
  let cached = indexCache.get(items)
  if (!cached) {
    cached = index(items)
    indexCache.set(items, cached)
  }
  return cached as Indexed<T>[]
}

function rank(entry: Indexed<unknown>, query: string, matchLaterParts: boolean): number | null {
  if (entry.full === query) return RANK_EXACT
  if (entry.full.startsWith(query)) return RANK_PREFIX
  if (matchLaterParts && entry.laterParts.some((part) => part.startsWith(query))) return RANK_PART_PREFIX
  if (entry.full.includes(query)) return RANK_SUBSTRING
  return null
}

function best<T extends { name: string }>(
  items: T[],
  query: string,
  limit: number,
  matchLaterParts: boolean,
): T[] {
  const ranked: { item: T; rank: number }[] = []
  for (const entry of indexOf(items)) {
    const entryRank = rank(entry, query, matchLaterParts)
    if (entryRank !== null) ranked.push({ item: entry.item, rank: entryRank })
  }
  ranked.sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name, COLLATION_LOCALE))
  return ranked.slice(0, limit).map((entry) => entry.item)
}

// Fuzzy-ish lookup used by the search palette: at most `limit` groups and lecturers, best first.
export function searchDirectory(
  query: string,
  groups: ApiGroup[],
  lecturers: ApiLecturer[],
  limit: number,
): SearchResult {
  const normalized = normalizeText(query)
  if (normalized === '') return { groups: [], lecturers: [] }
  return {
    groups: best(groups, normalized, limit, false),
    lecturers: best(lecturers, normalized, limit, true),
  }
}
