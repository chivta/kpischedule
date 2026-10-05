import { describe, expect, it } from 'vitest'
import { normalizeSchedule } from './normalize'
import type { ApiDay, ApiPair } from './types'

const DAY_CODES = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб']

function pair(overrides: Partial<ApiPair>): ApiPair {
  return {
    type: 'Лек',
    time: '08:30:00',
    name: 'Бази даних',
    location: null,
    tag: 'lec',
    dates: [],
    ...overrides,
  }
}

function week(pairsByDay: Record<string, ApiPair[]>): ApiDay[] {
  return DAY_CODES.map((day) => ({ day, pairs: pairsByDay[day] ?? [] }))
}

describe('normalizeSchedule', () => {
  it('places pairs by week and by the API day code, including "Вв" for Tuesday', () => {
    const { lessons } = normalizeSchedule({
      scheduleFirstWeek: week({ Вв: [pair({ name: 'Tuesday' })] }),
      scheduleSecondWeek: week({ Сб: [pair({ name: 'Saturday', time: '20:00:00' })] }),
    })
    expect(lessons).toHaveLength(2)
    expect(lessons[0]).toMatchObject({ week: 1, day: 1, time: '08:30', name: 'Tuesday' })
    expect(lessons[1]).toMatchObject({ week: 2, day: 5, time: '20:00', name: 'Saturday' })
  })

  it('fills in a missing lecturer, groups and an unknown tag', () => {
    const { lessons, profile } = normalizeSchedule({
      scheduleFirstWeek: week({ Пн: [pair({ lecturer: null, tag: 'seminar', name: ' Спротив ' })] }),
      scheduleSecondWeek: week({}),
    })
    expect(lessons[0]).toMatchObject({ lecturer: null, groups: [], tag: 'other', name: 'Спротив' })
    expect(profile).toBeNull()
  })

  it('gives every lesson in a schedule a distinct key', () => {
    const same = [pair({}), pair({})]
    const { lessons } = normalizeSchedule({
      scheduleFirstWeek: week({ Пн: same, Ср: same }),
      scheduleSecondWeek: week({ Пн: same }),
    })
    expect(new Set(lessons.map((lesson) => lesson.key)).size).toBe(lessons.length)
  })
})
