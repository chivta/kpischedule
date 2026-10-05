import { NAMES } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup, swipe } from './helpers'

test.beforeEach(async ({}, testInfo) => test.skip(testInfo.project.name === 'desktop', 'Mobile day view only'))

test('six day tabs select today and tapping a tab changes the lesson list', async ({ page }) => {
  await openGroup(page)
  const tabs = page.getByTestId('day-tab')
  await expect(tabs).toHaveCount(6)
  await expect(page.locator('[data-testid="day-tab"][data-date="2026-10-06"]')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('[data-testid="day-tab"][data-date="2026-10-07"]').click()
  await expect(page.getByTestId('lesson-card').first()).toContainText('Цивільний захист')
})

test('horizontal swipe advances a day and crossing Saturday advances a week', async ({ page }) => {
  await openGroup(page)
  const tabs = page.getByTestId('day-tab')
  const list = tabs.first().locator('xpath=../following-sibling::div[1]')
  await swipe(list, 'left')
  await expect(page.locator('[data-testid="day-tab"][data-date="2026-10-07"]')).toHaveAttribute('aria-pressed', 'true')
  await tabs.last().click()
  await expect(page.getByTestId('lesson-card')).toContainText([NAMES.next])
  await swipe(list, 'left')
  await expect(page.getByTestId('week-label')).toContainText('12–17 жовтня')
  await expect(page.locator('[data-testid="day-tab"][data-date="2026-10-12"]')).toHaveAttribute('aria-pressed', 'true')
})
