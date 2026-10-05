import { api } from '../api/client'
import type { ApiGroup, ApiLecturer } from '../api/types'
import { DAY_MS, useCachedQuery, type QueryState } from './useCachedQuery'

const GROUPS_CACHE_KEY = 'groups'
const LECTURERS_CACHE_KEY = 'lecturers'

// The full group list, about 2200 entries, cached for a day. Pass false to skip loading.
export function useGroups(enabled: boolean): QueryState<ApiGroup[]> {
  return useCachedQuery(enabled ? GROUPS_CACHE_KEY : null, api.groups, DAY_MS)
}

// The full lecturer list, about 2200 entries, cached for a day. Pass false to skip loading.
export function useLecturers(enabled: boolean): QueryState<ApiLecturer[]> {
  return useCachedQuery(enabled ? LECTURERS_CACHE_KEY : null, api.lecturers, DAY_MS)
}
