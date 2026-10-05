// Helpers shared by the week grid and the day view: which lessons fill a timetable cell.

import type { Lesson } from '../../api/types'
import {
  MINUTES_PER_HOUR,
  PAIR_DURATION_MIN,
  occursOn,
  scheduledOn,
  type IsoDate,
  type Slot,
  type WeekAnchor,
} from '../../lib/time'

const CLOCK_PAD = 2

export interface CellLesson {
  lesson: Lesson
  // False for a lesson that sits in the timetable but is not held on this date.
  held: boolean
}

// Minutes since midnight as "HH:mm".
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR
  return `${String(hours).padStart(CLOCK_PAD, '0')}:${String(rest).padStart(CLOCK_PAD, '0')}`
}

// End time of a pair as "HH:mm".
export function slotEndLabel(slot: Slot): string {
  return formatMinutes(slot.start + PAIR_DURATION_MIN)
}

// Lessons of one date and slot. Held ones come first, and with `showAll` the unheld ones follow.
export function cellLessons(
  lessons: Lesson[],
  date: IsoDate,
  slot: Slot,
  anchor: WeekAnchor,
  showAll: boolean,
): CellLesson[] {
  const inSlot = lessons.filter((lesson) => lesson.time === slot.time)
  const held = inSlot.filter((lesson) => occursOn(lesson, date, anchor)).map((lesson) => ({ lesson, held: true }))
  if (!showAll) return held
  const notHeld = inSlot
    .filter((lesson) => scheduledOn(lesson, date, anchor) && !occursOn(lesson, date, anchor))
    .map((lesson) => ({ lesson, held: false }))
  return [...held, ...notHeld]
}
