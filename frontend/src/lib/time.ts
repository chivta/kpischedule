// Kyiv wall-clock helpers and the rules that place a lesson on a calendar date.
// Dates are "YYYY-MM-DD" strings naming a Kyiv calendar day. Arithmetic on them runs in UTC,
// so daylight saving never shifts a day.

import type { Lesson, WeekNumber } from '../api/types'

// Legacy alias of Europe/Kyiv. Every browser accepts it, older ones reject the new name.
export const KYIV_TIME_ZONE = 'Europe/Kiev'

// A KPI pair lasts 95 minutes. The API only gives start times.
export const PAIR_DURATION_MIN = 95

export const STUDY_DAYS_PER_WEEK = 6
export const DAYS_PER_WEEK = 7
export const SUNDAY_INDEX = 6
export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR
const MS_PER_DAY = MINUTES_PER_DAY * 60 * 1000

// How far ahead to look for the next lesson. Two weeks covers both week numbers.
export const NEXT_LESSON_LOOKAHEAD_DAYS = 14

// Used until /schedule/lessons/slots answers. Matches the API response on 2026-10-05.
export const DEFAULT_SLOT_STARTS = ['08:30', '10:25', '12:20', '14:15', '16:10', '18:05', '20:00']

export type IsoDate = string

export interface KyivClock {
  date: IsoDate
  // 0 is Monday, 6 is Sunday.
  dayIndex: number
  // Minutes since Kyiv midnight.
  minutes: number
  // Seconds into the current minute.
  seconds: number
}

// The week number the server reported for the week that starts on `monday`.
export interface WeekAnchor {
  monday: IsoDate
  week: WeekNumber
}

export interface Slot {
  // 1-based pair number.
  number: number
  // "HH:mm"
  time: string
  start: number
  end: number
}

const kyivFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: KYIV_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function toUtcMs(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 'YYYY-MM-DD'.length)
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY)
}

// 0 is Monday, 6 is Sunday.
export function dayIndexOf(date: IsoDate): number {
  return (new Date(toUtcMs(date)).getUTCDay() + SUNDAY_INDEX) % DAYS_PER_WEEK
}

export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, -dayIndexOf(date))
}

// The six study dates, Monday to Saturday, of the week that starts on `monday`.
export function studyDatesOf(monday: IsoDate): IsoDate[] {
  return Array.from({ length: STUDY_DAYS_PER_WEEK }, (_, day) => addDays(monday, day))
}

// A Date positioned at UTC midnight of the given day, for Intl formatting with timeZone "UTC".
export function toUtcDate(date: IsoDate): Date {
  return new Date(toUtcMs(date))
}

export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

export function kyivClock(now: Date): KyivClock {
  const parts: Record<string, string> = {}
  for (const part of kyivFormatter.formatToParts(now)) parts[part.type] = part.value
  const date = `${parts.year}-${parts.month}-${parts.day}`
  return {
    date,
    dayIndex: dayIndexOf(date),
    minutes: Number(parts.hour) * MINUTES_PER_HOUR + Number(parts.minute),
    seconds: Number(parts.second),
  }
}

// Week number of the week containing `date`. Weeks alternate 1, 2, 1, 2 from the anchor.
export function weekNumberOf(anchor: WeekAnchor, date: IsoDate): WeekNumber {
  const weeksApart = daysBetween(anchor.monday, mondayOf(date)) / DAYS_PER_WEEK
  const sameAsAnchor = Math.abs(weeksApart) % 2 === 0
  if (sameAsAnchor) return anchor.week
  return anchor.week === 1 ? 2 : 1
}

// Builds the pair table from start times. Duplicates collapse, order follows the clock.
export function buildSlots(times: string[]): Slot[] {
  return [...new Set(times)]
    .sort((a, b) => parseTime(a) - parseTime(b))
    .map((time, index) => {
      const start = parseTime(time)
      return { number: index + 1, time, start, end: start + PAIR_DURATION_MIN }
    })
}

// A lesson with dates is held on exactly those dates. Without dates it repeats every
// fortnight on its weekday.
export function occursOn(lesson: Lesson, date: IsoDate, anchor: WeekAnchor): boolean {
  if (lesson.dates.length > 0) return lesson.dates.includes(date)
  return lesson.day === dayIndexOf(date) && lesson.week === weekNumberOf(anchor, date)
}

// True when the lesson sits in the timetable cell of `date`, whether or not it is held then.
export function scheduledOn(lesson: Lesson, date: IsoDate, anchor: WeekAnchor): boolean {
  return lesson.day === dayIndexOf(date) && lesson.week === weekNumberOf(anchor, date)
}

function byTime(a: Lesson, b: Lesson): number {
  return parseTime(a.time) - parseTime(b.time)
}

// Lessons held on `date`, earliest first.
export function lessonsOn(lessons: Lesson[], date: IsoDate, anchor: WeekAnchor): Lesson[] {
  return lessons.filter((lesson) => occursOn(lesson, date, anchor)).sort(byTime)
}

// The first date on or after `from` the lesson is held on, or null when none remain.
export function nextDateOf(lesson: Lesson, from: IsoDate): IsoDate | null {
  if (lesson.dates.length === 0) return null
  return [...lesson.dates].sort().find((date) => date >= from) ?? null
}

export interface CurrentPair {
  slot: Slot
  lessons: Lesson[]
  minutesLeft: number
  // 0 to 1, with second precision.
  progress: number
}

export interface UpcomingPair {
  date: IsoDate
  slot: Slot
  lessons: Lesson[]
  // 0 means today, 1 tomorrow.
  daysAhead: number
  minutesUntil: number
}

export interface NowState {
  current: CurrentPair | null
  next: UpcomingPair | null
  // Pairs still ahead today, the running one included.
  remainingToday: number
}

// Finds what is running at `clock` and what starts next, looking up to two weeks ahead.
export function computeNow(
  lessons: Lesson[],
  clock: KyivClock,
  anchor: WeekAnchor,
  slots: Slot[],
): NowState {
  let current: CurrentPair | null = null
  let next: UpcomingPair | null = null
  let remainingToday = 0

  for (let daysAhead = 0; daysAhead <= NEXT_LESSON_LOOKAHEAD_DAYS && !next; daysAhead++) {
    const date = addDays(clock.date, daysAhead)
    const dayLessons = lessonsOn(lessons, date, anchor)
    for (const slot of slots) {
      const slotLessons = dayLessons.filter((lesson) => lesson.time === slot.time)
      if (slotLessons.length === 0) continue
      const isToday = daysAhead === 0
      if (isToday && slot.end <= clock.minutes) continue
      if (isToday) remainingToday++
      if (isToday && slot.start <= clock.minutes) {
        const elapsed = clock.minutes - slot.start + clock.seconds / 60
        current = {
          slot,
          lessons: slotLessons,
          minutesLeft: slot.end - clock.minutes,
          progress: Math.min(1, elapsed / PAIR_DURATION_MIN),
        }
        continue
      }
      if (!next) {
        next = {
          date,
          slot,
          lessons: slotLessons,
          daysAhead,
          minutesUntil: daysAhead * MINUTES_PER_DAY + slot.start - clock.minutes,
        }
      }
    }
  }

  return { current, next, remainingToday }
}
