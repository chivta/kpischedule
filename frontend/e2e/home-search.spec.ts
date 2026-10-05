import { translations } from '../src/i18n/translations'
import { IDS, NAMES, PATHS } from './constants'
import { expect, test } from './fixtures/test'
import { openSearch } from './helpers'

const t = translations.uk

test('home renders and every search shortcut opens and Escape closes the palette', async ({ page }) => {
  await page.goto(PATHS.home)
  await expect(page.getByRole('heading', { name: t['home.title'], exact: true })).toBeVisible()

  await openSearch(page)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('search-input')).toBeHidden()
  await page.keyboard.press('Control+k')
  await expect(page.getByTestId('search-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await page.keyboard.press('/')
  await expect(page.getByTestId('search-input')).toBeFocused()
})

test('Latin group query and lecturer surname return the intended results', async ({ page }) => {
  await page.goto(PATHS.home)
  await openSearch(page)
  await page.getByTestId('search-input').fill('io-5')
  await expect(page.getByTestId('search-item').filter({ hasText: NAMES.searchGroup }).first()).toBeVisible()
  await page.getByTestId('search-input').fill('Завгор')
  await expect(page.getByTestId('search-item').filter({ hasText: NAMES.lecturer })).toBeVisible()
})

test('Enter opens a group result and shows its owner', async ({ page }) => {
  await page.goto(PATHS.home)
  await openSearch(page)
  await page.getByTestId('search-input').fill('ii-51')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/group/${IDS.group}$`))
  await expect(page.getByTestId('owner-name')).toHaveText(NAMES.group)
})

test('Enter opens a lecturer result and nonsense queries show the empty message', async ({ page }) => {
  await page.goto(PATHS.home)
  await openSearch(page)
  await page.getByTestId('search-input').fill('not-a-real-kpi-owner-999')
  await expect(page.getByText(t['search.empty'])).toBeVisible()
  await page.getByTestId('search-input').fill('Завгор')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/lecturer/${IDS.lecturer}$`))
  await expect(page.getByTestId('owner-name')).toHaveText(NAMES.lecturer)
})
