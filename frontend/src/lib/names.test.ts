import { expect, it } from 'vitest'
import { shortName } from './names'

it('abbreviates given names and keeps the surname', () => {
  expect(shortName('Завгородній Валерій Вікторович')).toBe('Завгородній В. В.')
  expect(shortName('  Іваненко  ')).toBe('Іваненко')
})
