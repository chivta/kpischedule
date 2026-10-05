import type { ApiDay, ApiSchedule, Lesson, LessonTag, Schedule, WeekNumber } from './types'

// Day codes exactly as the API sends them. Tuesday is "Вв", not "Вт".
const API_DAY_CODES = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб']

const KNOWN_TAGS: readonly string[] = ['lec', 'prac', 'lab']

const TIME_LENGTH = 'HH:mm'.length

function normalizeWeek(days: ApiDay[], week: WeekNumber): Lesson[] {
  return days.flatMap((apiDay, position) => {
    const codeIndex = API_DAY_CODES.indexOf(apiDay.day)
    // The API always sends six days in order, so position covers an unknown code.
    const day = codeIndex === -1 ? position : codeIndex
    return (apiDay.pairs ?? []).map((pair, index): Lesson => ({
      key: `${week}-${day}-${index}`,
      week,
      day,
      time: pair.time.slice(0, TIME_LENGTH),
      name: pair.name.trim(),
      tag: KNOWN_TAGS.includes(pair.tag) ? (pair.tag as LessonTag) : 'other',
      lecturer: pair.lecturer ?? null,
      groups: pair.groups ?? [],
      location: pair.location?.title ? pair.location : null,
      dates: pair.dates ?? [],
    }))
  })
}

// Flattens both week arrays of a group or lecturer schedule into one lesson list.
export function normalizeSchedule(raw: ApiSchedule): Schedule {
  return {
    lessons: [...normalizeWeek(raw.scheduleFirstWeek, 1), ...normalizeWeek(raw.scheduleSecondWeek, 2)],
    profile: raw.profile ?? null,
  }
}
