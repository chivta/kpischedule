import { translations } from '../src/i18n/translations'
import { PATHS } from './constants'
import { expect, test } from './fixtures/test'

const uk = translations.uk
const en = translations.en

test('theme cycles through all choices and persists across reload', async ({ page }) => {
  await page.goto(PATHS.home)
  const button = page.getByRole('button', { name: new RegExp(`^${uk['theme.toggle']}`) })
  await expect(button).toHaveAccessibleName(`${uk['theme.toggle']}: ${uk['theme.system']}`)
  await button.click()
  await expect(button).toHaveAccessibleName(`${uk['theme.toggle']}: ${uk['theme.light']}`)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await button.click()
  await expect(button).toHaveAccessibleName(`${uk['theme.toggle']}: ${uk['theme.dark']}`)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: new RegExp(`^${uk['theme.toggle']}`) }).click()
  await expect(page.getByRole('button', { name: new RegExp(`^${uk['theme.toggle']}`) })).toHaveAccessibleName(
    `${uk['theme.toggle']}: ${uk['theme.system']}`,
  )
})

test('language switches visible text to English and back to Ukrainian', async ({ page }) => {
  await page.goto(PATHS.home)
  await page.getByRole('button', { name: uk['locale.toggle'] }).click()
  await expect(page.getByRole('heading', { name: en['home.title'], exact: true })).toBeVisible()
  await page.getByRole('button', { name: en['locale.toggle'] }).click()
  await expect(page.getByRole('heading', { name: uk['home.title'], exact: true })).toBeVisible()
})
