import { translations } from '../src/i18n/translations'
import { CACHE_MAX_AGE_MS, NAMES, PATHS } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

const t = translations.uk

test('unknown group shows the empty schedule state', async ({ page }) => {
  await page.goto(PATHS.emptyGroup)
  await expect(page.getByTestId('schedule-empty')).toContainText(t['schedule.empty'])
})

test('HTTP failure shows an error and retry reloads a recovered endpoint', async ({ page, mockApi }) => {
  mockApi.setLessonsMode('error')
  await page.goto(PATHS.group)
  const error = page.getByTestId('schedule-error')
  await expect(error).toContainText(t['error.http'])
  mockApi.setLessonsMode('ok')
  await error.getByRole('button', { name: t['error.retry'] }).click()
  await expect(page.getByTestId('owner-name')).toHaveText(NAMES.group)
})

test('stale cached schedule remains visible offline with a notice', async ({ page, mockApi }) => {
  await openGroup(page)
  mockApi.setLessonsMode('abort')
  await page.clock.fastForward(CACHE_MAX_AGE_MS + 1)
  await page.reload()
  await expect(page.getByTestId('owner-name')).toHaveText(NAMES.group)
  await expect(page.getByTestId('lesson-card').first()).toBeVisible()
  await expect(page.getByTestId('offline-note')).toContainText(t['schedule.offline'])
})

test('unknown path renders the not-found page', async ({ page }) => {
  await page.goto(PATHS.missing)
  await expect(page.getByRole('heading', { name: t['notFound.title'] })).toBeVisible()
})
