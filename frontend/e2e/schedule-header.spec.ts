import { translations } from '../src/i18n/translations'
import { NAMES, PATHS } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

const t = translations.uk

test('group header includes faculty and lecturer header exposes profile without exams', async ({ page }) => {
  await openGroup(page)
  await expect(page.getByText(`${t['owner.group']} · ${NAMES.faculty}`)).toBeVisible()
  await page.goto(PATHS.lecturer)
  await expect(page.getByRole('link', { name: t['schedule.lecturerProfile'] })).toHaveAttribute('href', /intellect\.kpi\.ua/)
  await expect(page.getByRole('tab', { name: t['schedule.tab.exams'] })).toHaveCount(0)
})

test('save toggle creates a home saved card and root boot redirects to it', async ({ page }) => {
  await openGroup(page)
  const toggle = page.getByTestId('save-toggle')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: t['app.home'] }).click()
  await expect(page.getByTestId('saved-card').filter({ hasText: NAMES.group })).toBeVisible()
  await page.goto(PATHS.home)
  await expect(page).toHaveURL(new RegExp(`${PATHS.group}$`))
})

test('share copies the current schedule URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:5174' })
  await openGroup(page)
  // Clipboard access needs a focused document, which parallel workers can take away.
  await page.bringToFront()
  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toHaveAccessibleName(t['schedule.copied'])
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
})
