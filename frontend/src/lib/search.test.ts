import { describe, expect, it } from 'vitest'
import type { ApiGroup, ApiLecturer } from '../api/types'
import { searchDirectory } from './search'

const groups: ApiGroup[] = [
  { id: 1, name: 'ІО-51', faculty: 'ФІОТ' },
  { id: 2, name: 'ІО-52', faculty: 'ФІОТ' },
  { id: 3, name: 'ТВ-51', faculty: 'ФІОТ' },
  { id: 4, name: 'КВ-11', faculty: 'ФІОТ' },
]
const lecturers: ApiLecturer[] = [
  { id: 'a', name: 'Іваненко Олександр Петрович' },
  { id: 'b', name: 'Петренко Іван Олегович' },
  { id: 'c', name: 'Завгородній Олег Іванович' },
]

describe('searchDirectory', () => {
  it('finds a Cyrillic group from a Latin lookalike query', () => {
    expect(searchDirectory('io-51', groups, lecturers, 8).groups.map((g) => g.name)).toEqual(['ІО-51'])
    expect(searchDirectory('IO51', groups, lecturers, 8).groups.map((g) => g.name)).toEqual(['ІО-51'])
  })

  it('ranks a prefix above a substring', () => {
    expect(searchDirectory('51', groups, lecturers, 8).groups.map((g) => g.name)).toEqual(['ІО-51', 'ТВ-51'])
    expect(searchDirectory('в-1', groups, lecturers, 8).groups.map((g) => g.name)).toEqual(['КВ-11'])
    expect(searchDirectory('іван', groups, lecturers, 8).lecturers.map((l) => l.id)).toEqual(['a', 'c', 'b'])
  })

  it('finds a lecturer by surname prefix and by given name', () => {
    expect(searchDirectory('завг', groups, lecturers, 8).lecturers.map((l) => l.id)).toEqual(['c'])
    expect(searchDirectory('олег', groups, lecturers, 8).lecturers.map((l) => l.id)).toEqual(['c', 'b'])
  })

  it('respects the limit', () => {
    expect(searchDirectory('і', groups, lecturers, 1).groups).toHaveLength(1)
  })

  it('returns nothing for an empty query', () => {
    expect(searchDirectory('  ', groups, lecturers, 8)).toEqual({ groups: [], lecturers: [] })
  })
})
