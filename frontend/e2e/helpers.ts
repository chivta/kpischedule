import { expect, type Locator, type Page } from '@playwright/test'
import { PATHS } from './constants'

// Opens a group schedule and waits for its stable owner heading.
export async function openGroup(page: Page, path: string = PATHS.group) {
  await page.goto(path)
  await expect(page.getByTestId('owner-name')).toBeVisible()
}

// Opens the search palette through its primary home-page control.
export async function openSearch(page: Page) {
  await page.getByTestId('home-search').click()
  await expect(page.getByTestId('search-input')).toBeFocused()
}

// Seeds one localStorage value before the application module initializes its stores.
export async function seedStorage(page: Page, key: string, value: unknown) {
  await page.addInitScript(({ storageKey, storageValue }) => {
    localStorage.setItem(storageKey, JSON.stringify(storageValue))
  }, { storageKey: key, storageValue: value })
}

// Dispatches a horizontal touch gesture on the mobile lesson list.
export async function swipe(locator: Locator, direction: 'left' | 'right') {
  const start = direction === 'left' ? 260 : 40
  const end = direction === 'left' ? 40 : 260
  await locator.evaluate((element, points) => {
    const first = new Touch({ identifier: 1, target: element, clientX: points.start, clientY: 100 })
    const last = new Touch({ identifier: 1, target: element, clientX: points.end, clientY: 100 })
    element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [first] }))
    element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [last] }))
  }, { start, end })
}
