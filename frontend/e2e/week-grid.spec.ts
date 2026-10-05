import { INSTANTS } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

test.beforeEach(async ({}, testInfo) => test.skip(testInfo.project.name === 'mobile', 'Desktop week grid only'))

test.describe('Friday electives', () => {
  test.use({ clockTime: INSTANTS.fridayElectives })
  test('seven lessons collapse to two cards and expand and collapse again', async ({ page }) => {
    await openGroup(page)
    const cards = page.getByTestId('lesson-card')
    const collapsed = await cards.count()
    const more = page.getByRole('button', { name: 'ще 5' })
    await expect(more).toBeVisible()
    await more.click()
    await expect(cards).toHaveCount(collapsed + 5)
    await page.getByRole('button', { name: 'згорнути' }).click()
    await expect(cards).toHaveCount(collapsed)
  })
})

test('show-all reveals not-held lessons and persists across reload', async ({ page }) => {
  await openGroup(page)
  await page.getByTestId('week-next').click()
  await expect(page.locator('[data-testid="lesson-card"][data-held="false"]')).toHaveCount(0)
  await page.getByTestId('show-all').click()
  await expect(page.getByTestId('show-all')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-testid="lesson-card"][data-held="false"]').first()).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('show-all')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('week-next').click()
  await expect(page.locator('[data-testid="lesson-card"][data-held="false"]').first()).toBeVisible()
  await page.getByTestId('show-all').click()
  await expect(page.locator('[data-testid="lesson-card"][data-held="false"]')).toHaveCount(0)
})
