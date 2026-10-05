import { translations } from '../src/i18n/translations'
import { KONAMI_CODE } from '../src/lib/konami'
import { FEEDBACK_URL, PATHS } from './constants'
import { expect, test } from './fixtures/test'

const uk = translations.uk
const OVERLAY = '[data-testid="jumpscare"]'
const IMAGE_ROUTE = '**/egg/jumpscare.png'
// A 1x1 PNG, so the suite never needs the real photo, which lives only in the cluster Secret.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)
// The narrowest phone width still in common use.
const NARROW_PHONE = { width: 320, height: 640 }
// Longer than the overlay's own display time.
const OVERLAY_LIFETIME_MS = 2500

test.describe('key sequence overlay', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Keyboard only')
    await page.route(IMAGE_ROUTE, (route) => route.fulfill({ contentType: 'image/png', body: TINY_PNG }))
  })

  // Presses every key of the sequence, optionally replacing the key at `brokenIndex`.
  async function typeSequence(page: import('@playwright/test').Page, brokenIndex = -1) {
    for (const [index, code] of KONAMI_CODE.entries()) {
      await page.keyboard.press(index === brokenIndex ? 'KeyX' : code)
    }
  }

  test('shows on any page and closes on its own', async ({ page }) => {
    await page.goto(PATHS.group)
    await expect(page.getByTestId('owner-name')).toBeVisible()
    await typeSequence(page)
    await expect(page.locator(OVERLAY)).toBeVisible()
    await page.clock.runFor(OVERLAY_LIFETIME_MS)
    await expect(page.locator(OVERLAY)).toHaveCount(0)
  })

  test('closes early on a key press', async ({ page }) => {
    await page.goto(PATHS.home)
    await typeSequence(page)
    await expect(page.locator(OVERLAY)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator(OVERLAY)).toHaveCount(0)
  })

  test('stays hidden when the sequence is broken', async ({ page }) => {
    await page.goto(PATHS.home)
    await typeSequence(page, KONAMI_CODE.length - 2)
    await expect(page.locator(OVERLAY)).toHaveCount(0)
  })

  test('stays hidden when the image is missing', async ({ page }) => {
    await page.unroute(IMAGE_ROUTE)
    await page.route(IMAGE_ROUTE, (route) => route.fulfill({ status: 404, body: '' }))
    await page.goto(PATHS.home)
    const imageRequest = page.waitForResponse(IMAGE_ROUTE)
    await typeSequence(page)
    await imageRequest
    await expect(page.locator(OVERLAY)).toHaveCount(0)
  })
})

test('the footer feedback link opens the Telegram account in a new tab', async ({ page }) => {
  await page.goto(PATHS.home)
  const link = page.getByRole('contentinfo').getByRole('link', { name: uk['feedback.open'] })
  await expect(link).toHaveAttribute('href', FEEDBACK_URL)
  await expect(link).toHaveAttribute('target', '_blank')
})

test('the top bar fits narrow phones without horizontal overflow', async ({ page }) => {
  await page.setViewportSize(NARROW_PHONE)
  for (const path of [PATHS.home, PATHS.group]) {
    await page.goto(path)
    const bar = await page.getByRole('banner').boundingBox()
    expect(bar && bar.x + bar.width).toBeLessThanOrEqual(NARROW_PHONE.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(NARROW_PHONE.width)
  }
})
