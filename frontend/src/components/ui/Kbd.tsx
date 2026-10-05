import type { ReactNode } from 'react'
import { color, font, fontSize, radius } from '../../theme'

// Keyboard key hint.
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 6px',
        borderRadius: radius.sm / 2,
        border: `1px solid ${color.border}`,
        background: color.surface,
        color: color.textMuted,
        fontFamily: font.mono,
        fontSize: fontSize.xs,
        lineHeight: 1.5,
      }}
    >
      {children}
    </kbd>
  )
}
