import { translations } from '../src/i18n/translations'
import { NAMES, PATHS } from './constants'
import { expect, test } from './fixtures/test'
import { openGroup } from './helpers'

const t = translations.uk

test('exam tab shows the captured exam and 69-day countdown', async ({ page }) => {
  await openGroup(page)
  await page.getByRole('tab', { name: t['schedule.tab.exams'] }).click()
  const exam = page.getByTestId('exam-card')
  await expect(exam).toContainText(NAMES.exam)
  await expect(exam).toContainText('14')
  await expect(exam).toContainText('10:25')
  await expect(exam).toContainText('через 69 днів')
})

test('a group without exams shows the empty state', async ({ page }) => {
  await openGroup(page, PATHS.noExamGroup)
  await page.getByRole('tab', { name: t['schedule.tab.exams'] }).click()
  await expect(page.getByTestId('exams-empty')).toContainText(t['exams.empty'])
})
