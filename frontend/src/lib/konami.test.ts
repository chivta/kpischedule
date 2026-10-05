import { describe, expect, it } from 'vitest'
import { KONAMI_CODE, createKonamiMatcher } from './konami'

function feed(codes: string[]): boolean[] {
  const match = createKonamiMatcher()
  return codes.map(match)
}

describe('createKonamiMatcher', () => {
  it('matches on the last key of the code', () => {
    const results = feed(KONAMI_CODE)
    expect(results.at(-1)).toBe(true)
    expect(results.slice(0, -1).every((result) => !result)).toBe(true)
  })

  it('matches after stray keys and an extra ArrowUp before the code', () => {
    expect(feed(['KeyX', 'ArrowUp', ...KONAMI_CODE]).at(-1)).toBe(true)
  })

  it('does not match when a key in the middle is wrong', () => {
    const broken = [...KONAMI_CODE]
    broken[4] = 'ArrowRight'
    expect(feed(broken).some(Boolean)).toBe(false)
  })

  it('starts over after a match', () => {
    const results = feed([...KONAMI_CODE, 'KeyB', 'KeyA'])
    expect(results.filter(Boolean)).toHaveLength(1)
  })
})
