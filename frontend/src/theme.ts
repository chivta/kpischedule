// Design tokens for inline styles. Colors point at the CSS variables in styles/global.css,
// so one style object works in both themes.

import type { CSSProperties } from 'react'
import type { LessonTag } from './api/types'

export const color = {
  bg: 'var(--bg)',
  bgRaised: 'var(--bg-raised)',
  surface: 'var(--surface)',
  surfaceStrong: 'var(--surface-strong)',
  surfaceHover: 'var(--surface-hover)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  inverse: 'var(--inverse)',
  overlay: 'var(--overlay)',
  glow: 'var(--glow)',
  live: 'var(--live)',
} as const

export const tagColor: Record<LessonTag, string> = {
  lec: 'var(--lec)',
  prac: 'var(--prac)',
  lab: 'var(--lab)',
  other: 'var(--other)',
}

// A translucent tint of a color, for chip and card backgrounds.
export function tint(cssColor: string, percent: number): string {
  return `color-mix(in srgb, ${cssColor} ${percent}%, transparent)`
}

export const font = {
  display: "'Unbounded Variable', system-ui, sans-serif",
  body: "'Onest Variable', system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
} as const

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
} as const

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 36,
} as const

export const zIndex = {
  scene: 0,
  content: 1,
  topBar: 20,
  overlay: 40,
  dialog: 50,
  killerFeature: 100,
} as const

// Viewport widths in px. Below `compact` the week shows one day at a time.
export const breakpoint = {
  compact: 920,
  wide: 1280,
} as const

export const PAGE_MAX_WIDTH = 1320
export const GLASS_BLUR_PX = 22

// Shared motion timing, in seconds.
export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
} as const

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Frosted panel look shared by every floating surface.
export const glass: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  backdropFilter: `blur(${GLASS_BLUR_PX}px) saturate(140%)`,
  WebkitBackdropFilter: `blur(${GLASS_BLUR_PX}px) saturate(140%)`,
  boxShadow: 'var(--shadow)',
}

// Limits text to `lines` lines with an ellipsis.
export function clampLines(lines: number): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}
