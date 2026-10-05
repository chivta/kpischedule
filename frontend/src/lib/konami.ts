// Konami code as KeyboardEvent.code values, so it matches on any keyboard layout.
export const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

// Returns a function to feed every pressed key code into. It returns true on the press that
// completes the code, then starts over.
export function createKonamiMatcher(): (code: string) => boolean {
  const recent: string[] = []
  return (code) => {
    recent.push(code)
    if (recent.length > KONAMI_CODE.length) recent.shift()
    const matched = recent.length === KONAMI_CODE.length && recent.every((key, index) => key === KONAMI_CODE[index])
    if (matched) recent.length = 0
    return matched
  }
}
