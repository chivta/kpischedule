// Raw shapes returned by api.campus.kpi.ua, and the normalized model the UI works with.

export interface ApiGroup {
  id: number
  name: string
  faculty: string
}

export interface ApiLecturer {
  id: string
  name: string
}

export interface ApiLocation {
  uri: string
  title: string
}

export interface ApiPair {
  // Present in group schedules, null when the API has no lecturer for the pair.
  lecturer?: ApiLecturer | null
  // Present in lecturer schedules instead of `lecturer`.
  groups?: { id: number; name: string }[]
  type: string
  // "HH:mm:ss", the pair start time in Kyiv.
  time: string
  name: string
  location: ApiLocation | null
  tag: string
  // ISO dates the pair is held on. Empty means every fortnight in its week.
  dates: string[]
}

export interface ApiDay {
  day: string
  pairs: ApiPair[]
}

export interface ApiLecturerProfile {
  id: number
  fullName: string
  photo: string
  credo: string
  profile: string
}

export interface ApiSchedule {
  scheduleFirstWeek: ApiDay[]
  scheduleSecondWeek: ApiDay[]
  profile?: ApiLecturerProfile | null
}

export interface ApiExam {
  id: string
  // Naive Kyiv datetime, "YYYY-MM-DDTHH:mm:ss".
  date: string
  subject: string
  lecturerName: string | null
  lecturerId: string | null
  room: string | null
}

export interface ApiCurrentTime {
  currentWeek: number
  currentDay: number
  currentLesson: number
}

// Slot number to "HH:mm:ss" start time.
export type ApiSlots = Record<string, string>

export interface ApiStatus {
  id: string
  groupName: string
  updated: string
}

export type LessonTag = 'lec' | 'prac' | 'lab' | 'other'
export type WeekNumber = 1 | 2
export type OwnerKind = 'group' | 'lecturer'

export interface Lesson {
  // Unique within one schedule.
  key: string
  week: WeekNumber
  // 0 is Monday, 5 is Saturday.
  day: number
  // "HH:mm" start time in Kyiv.
  time: string
  name: string
  tag: LessonTag
  lecturer: ApiLecturer | null
  groups: { id: number; name: string }[]
  location: ApiLocation | null
  dates: string[]
}

export interface Schedule {
  lessons: Lesson[]
  profile: ApiLecturerProfile | null
}
