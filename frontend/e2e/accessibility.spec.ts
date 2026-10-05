import type { Page } from '@playwright/test'
import { PATHS } from './constants'
import { expect, test } from './fixtures/test'

// Verifies every native button on a page exposes a computed accessible name.
async function expectNamedButtons(page: Page) {
  const unnamed = await page.locator('button').evaluateAll((buttons) => buttons
    .map((button, index) => ({
      index,
      named: Boolean(
        button.getAttribute('aria-label')?.trim()
        || button.getAttribute('aria-labelledby')
        || button.textContent?.trim(),
      ),
    }))
    .filter((button) => !button.named))
  expect(unnamed).toEqual([])
}

test('buttons have accessible names across primary pages and dialogs', async ({ page }) => {
  await page.goto(PATHS.home)
  await expectNamedButtons(page)
  await page.getByTestId('home-search').click()
  await expectNamedButtons(page)
  await page.keyboard.press('Escape')
  await page.goto(PATHS.group)
  await expect(page.getByTestId('owner-name')).toBeVisible()
  await expectNamedButtons(page)
  await page.getByTestId('lesson-card').first().click()
  await expectNamedButtons(page)
  await page.keyboard.press('Escape')
  await page.goto(PATHS.lecturer)
  await expect(page.getByTestId('owner-name')).toBeVisible()
  await expectNamedButtons(page)
  await page.goto(PATHS.missing)
  await expectNamedButtons(page)
})
