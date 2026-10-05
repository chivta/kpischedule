import { normalizeSchedule } from './normalize'
import type {
  ApiCurrentTime,
  ApiExam,
  ApiGroup,
  ApiLecturer,
  ApiSchedule,
  ApiSlots,
  ApiStatus,
  Schedule,
} from './types'

export const API_BASE_URL = 'https://api.campus.kpi.ua'

// Machine-readable codes. The translation map turns them into text under `error.<code>`.
export type ApiErrorCode = 'network' | 'http' | 'invalid_response'

// Status is 0 when no response arrived.
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(code: ApiErrorCode, status = 0) {
    super(code)
    this.code = code
    this.status = status
  }
}

// GET without custom headers, so the browser sends no CORS preflight.
async function getJson<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`)
  } catch {
    throw new ApiError('network')
  }
  if (!response.ok) throw new ApiError('http', response.status)
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('invalid_response', response.status)
  }
}

async function getSchedule(path: string): Promise<Schedule> {
  const raw = await getJson<ApiSchedule>(path)
  if (!Array.isArray(raw?.scheduleFirstWeek) || !Array.isArray(raw?.scheduleSecondWeek)) {
    throw new ApiError('invalid_response')
  }
  return normalizeSchedule(raw)
}

async function getList<T>(path: string): Promise<T[]> {
  const raw = await getJson<T[]>(path)
  if (!Array.isArray(raw)) throw new ApiError('invalid_response')
  return raw
}

export const api = {
  groups: () => getList<ApiGroup>('/group/all'),
  lecturers: () => getList<ApiLecturer>('/schedule/lecturer/list'),
  groupSchedule: (groupId: string) =>
    getSchedule(`/schedule/lessons?groupId=${encodeURIComponent(groupId)}`),
  lecturerSchedule: (lecturerId: string) =>
    getSchedule(`/schedule/lecturer?lecturerId=${encodeURIComponent(lecturerId)}`),
  exams: (groupId: string) =>
    getList<ApiExam>(`/schedule/exams/group?groupId=${encodeURIComponent(groupId)}`),
  currentTime: () => getJson<ApiCurrentTime>('/time/current'),
  slots: () => getJson<ApiSlots>('/schedule/lessons/slots'),
  status: (groupId: string) =>
    getList<ApiStatus>(`/schedule/status?groupId=${encodeURIComponent(groupId)}`),
}
