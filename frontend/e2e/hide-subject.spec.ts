import { NAMES } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

test('hide removes a subject from the grid and now panel and restore returns it', async ({ page }) => {
  await openGroup(page)
  await expect(page.getByTestId('now-panel')).toContainText(NAMES.running)
  await page.getByTestId('now-headline').getByRole('button').click()
  await page.getByTestId('hide-subject').click()
  await expect(page.getByTestId('now-panel')).not.toContainText(NAMES.running)
  await expect(page.getByTestId('lesson-card').filter({ hasText: NAMES.running })).toHaveCount(0)
  await page.getByTestId('restore-hidden').click()
  await expect(page.getByTestId('now-panel')).toContainText(NAMES.running)
  await expect(page.getByTestId('lesson-card').filter({ hasText: NAMES.running }).first()).toBeVisible()
})

test('hidden subjects persist across reload', async ({ page }) => {
  await openGroup(page)
  await page.getByTestId('now-headline').getByRole('button').click()
  await page.getByTestId('hide-subject').click()
  await page.reload()
  await expect(page.getByTestId('lesson-card').filter({ hasText: NAMES.running })).toHaveCount(0)
  await expect(page.getByTestId('restore-hidden')).toBeVisible()
})
