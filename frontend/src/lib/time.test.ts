import { describe, expect, it } from 'vitest'
import type { Lesson } from '../api/types'
import {
  DEFAULT_SLOT_STARTS,
  addDays,
  buildSlots,
  computeNow,
  dayIndexOf,
  kyivClock,
  lessonsOn,
  mondayOf,
  nextDateOf,
  occursOn,
  weekNumberOf,
  type KyivClock,
  type WeekAnchor,
} from './time'

// Monday 2026-10-05 was week 2 according to /time/current.
const ANCHOR: WeekAnchor = { monday: '2026-10-05', week: 2 }
const SLOTS = buildSlots(DEFAULT_SLOT_STARTS)

function lesson(overrides: Partial<Lesson>): Lesson {
  return {
    key: `${overrides.week}-${overrides.day}-${overrides.time}`,
    week: 2,
    day: 0,
    time: '08:30',
    name: 'Бази даних',
    tag: 'lec',
    lecturer: null,
    groups: [],
    location: null,
    dates: [],
    ...overrides,
  }
}

function clock(date: string, time: string, seconds = 0): KyivClock {
  const [hours, minutes] = time.split(':').map(Number)
  return { date, dayIndex: dayIndexOf(date), minutes: hours * 60 + minutes, seconds }
}

describe('dates', () => {
  it('maps weekdays to a Monday-based index', () => {
    expect(dayIndexOf('2026-10-05')).toBe(0)
    expect(dayIndexOf('2026-10-10')).toBe(5)
    expect(dayIndexOf('2026-10-11')).toBe(6)
  })

  it('finds the Monday of a week, across a month boundary', () => {
    expect(mondayOf('2026-10-11')).toBe('2026-10-05')
    expect(mondayOf('2026-10-01')).toBe('2026-09-28')
  })

  it('adds days across the autumn clock change', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
})

describe('kyivClock', () => {
  it('reads Kyiv summer time as UTC+3', () => {
    expect(kyivClock(new Date('2026-10-05T19:55:30Z'))).toEqual({
      date: '2026-10-05',
      dayIndex: 0,
      minutes: 22 * 60 + 55,
      seconds: 30,
    })
  })

  it('reads Kyiv winter time as UTC+2 and rolls the date at midnight', () => {
    expect(kyivClock(new Date('2026-12-14T22:10:00Z'))).toMatchObject({
      date: '2026-12-15',
      dayIndex: 1,
      minutes: 10,
    })
  })
})

describe('weekNumberOf', () => {
  it('alternates weeks in both directions from the anchor', () => {
    expect(weekNumberOf(ANCHOR, '2026-10-05')).toBe(2)
    expect(weekNumberOf(ANCHOR, '2026-10-11')).toBe(2)
    expect(weekNumberOf(ANCHOR, '2026-10-12')).toBe(1)
    expect(weekNumberOf(ANCHOR, '2026-10-19')).toBe(2)
    expect(weekNumberOf(ANCHOR, '2026-09-28')).toBe(1)
    expect(weekNumberOf(ANCHOR, '2026-09-21')).toBe(2)
  })
})

describe('buildSlots', () => {
  it('numbers pairs in clock order and drops duplicates', () => {
    const slots = buildSlots(['10:25', '08:30', '10:25'])
    expect(slots).toEqual([
      { number: 1, time: '08:30', start: 510, end: 605 },
      { number: 2, time: '10:25', start: 625, end: 720 },
    ])
  })
})

describe('occursOn', () => {
  it('repeats an undated lesson every fortnight on its weekday', () => {
    const regular = lesson({ week: 2, day: 0 })
    expect(occursOn(regular, '2026-10-05', ANCHOR)).toBe(true)
    expect(occursOn(regular, '2026-10-12', ANCHOR)).toBe(false)
    expect(occursOn(regular, '2026-10-19', ANCHOR)).toBe(true)
    expect(occursOn(regular, '2026-10-06', ANCHOR)).toBe(false)
  })

  it('holds a dated lesson only on its dates', () => {
    const dated = lesson({ week: 2, day: 0, dates: ['2026-10-05', '2026-11-02'] })
    expect(occursOn(dated, '2026-10-05', ANCHOR)).toBe(true)
    expect(occursOn(dated, '2026-10-19', ANCHOR)).toBe(false)
    expect(occursOn(dated, '2026-11-02', ANCHOR)).toBe(true)
  })
})

describe('lessonsOn', () => {
  it('keeps one of two lessons sharing a cell when dates tell them apart', () => {
    const lessons = [
      lesson({ key: 'a', time: '16:10', name: 'A', dates: ['2026-10-05'] }),
      lesson({ key: 'b', time: '16:10', name: 'B', dates: ['2026-10-19'] }),
      lesson({ key: 'c', time: '08:30', name: 'C' }),
    ]
    expect(lessonsOn(lessons, '2026-10-05', ANCHOR).map((l) => l.name)).toEqual(['C', 'A'])
    expect(lessonsOn(lessons, '2026-10-19', ANCHOR).map((l) => l.name)).toEqual(['C', 'B'])
  })
})

describe('nextDateOf', () => {
  it('returns the first date not in the past', () => {
    const dated = lesson({ dates: ['2026-11-02', '2026-10-05', '2026-10-19'] })
    expect(nextDateOf(dated, '2026-10-06')).toBe('2026-10-19')
    expect(nextDateOf(dated, '2026-11-03')).toBeNull()
    expect(nextDateOf(lesson({}), '2026-10-06')).toBeNull()
  })
})

describe('computeNow', () => {
  const lessons = [
    lesson({ key: 'mon1', day: 0, time: '08:30', name: 'First' }),
    lesson({ key: 'mon2', day: 0, time: '10:25', name: 'Second' }),
    lesson({ key: 'wed', day: 2, time: '12:20', name: 'Wednesday' }),
    lesson({ key: 'w1', week: 1, day: 0, time: '14:15', name: 'Other week' }),
  ]

  it('reports the next pair before the day starts', () => {
    const state = computeNow(lessons, clock('2026-10-05', '08:00'), ANCHOR, SLOTS)
    expect(state.current).toBeNull()
    expect(state.next).toMatchObject({ daysAhead: 0, minutesUntil: 30 })
    expect(state.next?.lessons[0].name).toBe('First')
    expect(state.remainingToday).toBe(2)
  })

  it('reports the running pair with progress and the one after it', () => {
    const state = computeNow(lessons, clock('2026-10-05', '09:17', 30), ANCHOR, SLOTS)
    expect(state.current?.lessons[0].name).toBe('First')
    expect(state.current?.minutesLeft).toBe(48)
    expect(state.current?.progress).toBeCloseTo(0.5)
    expect(state.next?.lessons[0].name).toBe('Second')
    expect(state.next?.minutesUntil).toBe(68)
    expect(state.remainingToday).toBe(2)
  })

  it('reports only the next pair during a break', () => {
    const state = computeNow(lessons, clock('2026-10-05', '10:10'), ANCHOR, SLOTS)
    expect(state.current).toBeNull()
    expect(state.next).toMatchObject({ daysAhead: 0, minutesUntil: 15 })
    expect(state.remainingToday).toBe(1)
  })

  it('looks to a later day once today is over', () => {
    const state = computeNow(lessons, clock('2026-10-05', '12:00'), ANCHOR, SLOTS)
    expect(state.current).toBeNull()
    expect(state.remainingToday).toBe(0)
    expect(state.next).toMatchObject({ date: '2026-10-07', daysAhead: 2 })
    expect(state.next?.minutesUntil).toBe(2 * 1440 + 20)
  })

  it('crosses into the other week from a Sunday', () => {
    const state = computeNow(lessons, clock('2026-10-11', '18:00'), ANCHOR, SLOTS)
    expect(state.next).toMatchObject({ date: '2026-10-12', daysAhead: 1 })
    expect(state.next?.lessons[0].name).toBe('Other week')
  })

  it('finds nothing in an empty schedule', () => {
    expect(computeNow([], clock('2026-10-05', '09:00'), ANCHOR, SLOTS)).toEqual({
      current: null,
      next: null,
      remainingToday: 0,
    })
  })
})
