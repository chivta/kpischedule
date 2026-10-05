import type { OwnerKind } from '../api/types'
import { lastViewedStore, savedStore, type ScheduleRef } from './storage'

export const HOME_PATH = '/'
export const GROUP_ROUTE = '/group/:id'
export const LECTURER_ROUTE = '/lecturer/:id'
export const REPO_URL = 'https://github.com/chivta/kpischedule'
// Feedback goes to the @ukbotsup Telegram account.
export const FEEDBACK_URL = 'https://t.me/ukbotsup'

export function schedulePath(ref: { kind: OwnerKind; id: string }): string {
  return `/${ref.kind}/${encodeURIComponent(ref.id)}`
}

// Where a returning visitor lands when opening the site root: the first saved schedule,
// or the last one viewed. Null sends them to the search page.
export function bootTarget(): ScheduleRef | null {
  return savedStore.get()[0] ?? lastViewedStore.get()
}
