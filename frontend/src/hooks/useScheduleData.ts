import { useEffect, useMemo } from 'react'
import { api, type ApiErrorCode } from '../api/client'
import type { ApiExam, ApiLecturerProfile, Lesson, OwnerKind } from '../api/types'
import { lastViewedStore, savedStore, useStore, weekAnchorStore, type ScheduleRef } from '../lib/storage'
import {
  DEFAULT_SLOT_STARTS,
  SUNDAY_INDEX,
  buildSlots,
  kyivClock,
  mondayOf,
  type Slot,
  type WeekAnchor,
} from '../lib/time'
import { DAY_MS, HOUR_MS, MINUTE_MS, useCachedQuery } from './useCachedQuery'
import { useGroups, useLecturers } from './useDirectory'

const SCHEDULE_MAX_AGE_MS = 10 * MINUTE_MS
const EXAMS_MAX_AGE_MS = HOUR_MS
const WEEK_MAX_AGE_MS = HOUR_MS
const TIME_LENGTH = 'HH:mm'.length

// Which week is running. The stored anchor answers at once, the server corrects it.
function useWeekAnchor(): WeekAnchor | null {
  const stored = useStore(weekAnchorStore)
  const { data, updatedAt } = useCachedQuery('time', api.currentTime, WEEK_MAX_AGE_MS)

  // The answer describes the week it was fetched in, which a cached copy may have left behind.
  const fetched = useMemo(() => (updatedAt === null ? null : kyivClock(new Date(updatedAt))), [updatedAt])
  // Whether the server counts Sunday into the ending week is unverified, so a Sunday answer
  // never replaces an anchor recorded on a study day and is never stored.
  const onSunday = fetched?.dayIndex === SUNDAY_INDEX
  const fromServer = useMemo<WeekAnchor | null>(() => {
    if (!data || !fetched || (onSunday && stored)) return null
    return { monday: mondayOf(fetched.date), week: data.currentWeek === 1 ? 1 : 2 }
  }, [data, fetched, onSunday, stored])

  useEffect(() => {
    if (!fromServer || onSunday) return
    const current = weekAnchorStore.get()
    if (current?.monday !== fromServer.monday || current.week !== fromServer.week) {
      weekAnchorStore.set(fromServer)
    }
  }, [fromServer, onSunday])

  return fromServer ?? stored
}

// The pair table: the API's slots plus any start time a lesson uses that the table lacks.
function useSlots(lessons: Lesson[]): Slot[] {
  const { data } = useCachedQuery('slots', api.slots, DAY_MS)
  return useMemo(() => {
    const starts = data
      ? Object.values(data).map((time) => time.slice(0, TIME_LENGTH))
      : DEFAULT_SLOT_STARTS
    return buildSlots([...starts, ...lessons.map((lesson) => lesson.time)])
  }, [data, lessons])
}

// The owner's display name. A saved or last viewed entry answers at once. A fresh shared link
// falls back to the lecturer profile or the full directory.
function useOwner(kind: OwnerKind, id: string, profile: ApiLecturerProfile | null): ScheduleRef | null {
  const saved = useStore(savedStore)
  const lastViewed = useStore(lastViewedStore)
  const known = [...saved, lastViewed].find((ref) => ref?.kind === kind && ref.id === id) ?? null

  const groups = useGroups(!known && kind === 'group')
  const lecturers = useLecturers(!known && kind === 'lecturer' && !profile)

  return useMemo(() => {
    if (known) return known
    if (kind === 'group') {
      const group = groups.data?.find((item) => String(item.id) === id)
      return group ? { kind, id, name: group.name, detail: group.faculty } : null
    }
    const name = profile?.fullName ?? lecturers.data?.find((item) => item.id === id)?.name
    return name ? { kind, id, name, detail: '' } : null
  }, [known, kind, id, groups.data, lecturers.data, profile])
}

const NO_LESSONS: Lesson[] = []

export interface ScheduleData {
  // Null while the name is still loading or when the id is unknown.
  owner: ScheduleRef | null
  lessons: Lesson[]
  profile: ApiLecturerProfile | null
  slots: Slot[]
  // Null until the current week is known. Nothing can be placed on dates before that.
  anchor: WeekAnchor | null
  // True until the first schedule copy, cached or fresh, is available.
  loading: boolean
  // Set when the latest fetch failed. Lessons may still hold a cached copy.
  error: ApiErrorCode | null
  // Epoch milliseconds of the fetch that produced `lessons`.
  updatedAt: number | null
}

// Everything the schedule page needs for one group or lecturer.
export function useScheduleData(kind: OwnerKind, id: string): ScheduleData {
  const schedule = useCachedQuery(
    `schedule:${kind}:${id}`,
    () => (kind === 'group' ? api.groupSchedule(id) : api.lecturerSchedule(id)),
    SCHEDULE_MAX_AGE_MS,
  )
  const lessons = schedule.data?.lessons ?? NO_LESSONS
  const profile = schedule.data?.profile ?? null
  const owner = useOwner(kind, id, profile)
  const anchor = useWeekAnchor()
  const slots = useSlots(lessons)

  // Remembered so the site root can reopen it on the next visit.
  useEffect(() => {
    if (owner && lessons.length > 0) lastViewedStore.set(owner)
  }, [owner, lessons.length])

  return {
    owner,
    lessons,
    profile,
    slots,
    anchor,
    loading: schedule.data === undefined && schedule.loading,
    error: schedule.error,
    updatedAt: schedule.updatedAt,
  }
}

// Exams of a group, soonest first. Pass a null id to skip loading.
export function useExams(groupId: string | null): ApiExam[] {
  const { data } = useCachedQuery(
    groupId === null ? null : `exams:${groupId}`,
    () => api.exams(groupId ?? ''),
    EXAMS_MAX_AGE_MS,
  )
  return useMemo(() => [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [data])
}
