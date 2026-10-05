import { translations } from '../src/i18n/translations'
import { INSTANTS, NAMES } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

const t = translations.uk

test.beforeEach(async ({}, testInfo) => test.skip(testInfo.project.name === 'mobile', 'Desktop week grid only'))

test('buttons and keyboard move weeks and Today restores the default', async ({ page }) => {
  await openGroup(page)
  const label = page.getByTestId('week-label')
  await expect(label).toContainText('Тиждень 2')
  await expect(page.getByTestId('week-today')).toHaveCount(0)
  await page.getByTestId('week-next').click()
  await expect(label).toContainText('Тиждень 1')
  await expect(page.getByTestId('week-today')).toBeVisible()
  await page.getByTestId('week-prev').click()
  await expect(label).toContainText('Тиждень 2')
  await page.keyboard.press('ArrowRight')
  await expect(label).toContainText('Тиждень 1')
  await page.keyboard.press('ArrowLeft')
  await expect(label).toContainText('Тиждень 2')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('t')
  await expect(label).toContainText('Тиждень 2')
  await expect(page.getByTestId('week-today')).toHaveCount(0)
})

test('week keys are ignored while the palette or lesson dialog is open', async ({ page }) => {
  await openGroup(page)
  const label = page.getByTestId('week-label')
  const original = await label.textContent()
  await page.keyboard.press('/')
  await page.keyboard.press('ArrowRight')
  await expect(label).toHaveText(original ?? '')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: new RegExp(`^${NAMES.running},`) }).click()
  await expect(page.getByTestId('lesson-dialog')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(label).toHaveText(original ?? '')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('lesson-dialog')).toBeHidden()
})

test('today column is marked on the desktop grid', async ({ page }) => {
  await openGroup(page)
  await expect(page.locator('[data-testid="day-column"][data-date="2026-10-06"]')).toHaveAttribute('data-today', 'true')
})
