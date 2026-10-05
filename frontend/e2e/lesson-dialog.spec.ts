import { NAMES, PATHS } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

// Makes the dated Monday lesson visible in both the desktop grid and mobile day view.
async function openDatedLesson(page: import('@playwright/test').Page) {
  const mondayTab = page.locator('[data-testid="day-tab"][data-date="2026-10-05"]')
  if (await mondayTab.count()) await mondayTab.click()
  await page.getByRole('button', { name: new RegExp(`^${NAMES.dated}, 08:30`) }).click()
}

test('lesson dialog shows complete dated lesson details and Escape closes it', async ({ page }) => {
  await openGroup(page)
  await openDatedLesson(page)
  const dialog = page.getByTestId('lesson-dialog')
  await expect(dialog).toContainText(NAMES.dated)
  await expect(dialog).toContainText('понеділок, 5 жовтня')
  await expect(dialog).toContainText('1 пара')
  await expect(dialog).toContainText('08:30 – 10:05')
  await expect(dialog).toContainText(NAMES.lecturer)
  await expect(dialog).toContainText('3 з 7 проведено')
  await expect(dialog.getByText('5 жовтня', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('lecturer link navigates to the lecturer schedule and closes the dialog', async ({ page }) => {
  await openGroup(page)
  await openDatedLesson(page)
  await page.getByTestId('lesson-lecturer-link').click()
  await expect(page).toHaveURL(new RegExp(`${PATHS.lecturer}$`))
  await expect(page.getByTestId('owner-name')).toHaveText(NAMES.lecturer)
  await expect(page.getByTestId('lesson-dialog')).toHaveCount(0)
})
