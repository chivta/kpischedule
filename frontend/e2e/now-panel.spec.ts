import { translations } from '../src/i18n/translations'
import { INSTANTS, NAMES } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

const t = translations.uk

const cases = [
  { name: 'running class', time: INSTANTS.running, headline: NAMES.running, next: NAMES.next },
  { name: 'break', time: INSTANTS.break, headline: t['now.break'], next: NAMES.next },
  { name: 'before the first pair', time: INSTANTS.beforeFirst, headline: t['now.beforeFirst'], next: NAMES.running },
  { name: 'done for today', time: INSTANTS.done, headline: t['now.done'], next: 'Цивільний захист' },
] as const

for (const scenario of cases) {
  test.describe(scenario.name, () => {
    test.use({ clockTime: scenario.time })
    test('now panel reports the correct state and next lesson', async ({ page }) => {
      await openGroup(page)
      await expect(page.getByTestId('now-headline')).toContainText(scenario.headline)
      await expect(page.getByTestId('now-next')).toContainText(scenario.next)
      if (scenario.time === INSTANTS.running) {
        await expect(page.locator('[data-testid="lesson-card"][data-state="live"]')).toHaveCount(1)
      }
    })
  })
}

test.describe('Sunday rollover', () => {
  test.use({ clockTime: INSTANTS.sunday })
  test('shows the following Monday to Saturday as week 1', async ({ page }) => {
    await openGroup(page)
    await expect(page.getByTestId('week-label')).toContainText('12–17 жовтня')
    await expect(page.getByTestId('week-label')).toContainText('Тиждень 1')
  })
})
