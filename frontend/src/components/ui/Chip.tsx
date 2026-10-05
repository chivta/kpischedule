import type { CSSProperties, ReactNode } from 'react'
import { color, fontSize, radius, space, tint } from '../../theme'

const CHIP_TINT_PERCENT = 16

interface ChipProps {
  // A CSS color, usually a lesson type color from `tagColor`. Omit for a neutral chip.
  tone?: string
  children: ReactNode
  style?: CSSProperties
}

// Small label pill.
export function Chip({ tone, children, style }: ChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.xxs,
        padding: `2px ${space.xs}px`,
        borderRadius: radius.pill,
        background: tone ? tint(tone, CHIP_TINT_PERCENT) : color.surfaceStrong,
        color: tone ?? color.textMuted,
        fontSize: fontSize.xs,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
