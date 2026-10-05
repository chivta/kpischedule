import type { CSSProperties } from 'react'
import { color, radius } from '../../theme'

interface SkeletonProps {
  width?: CSSProperties['width']
  height: CSSProperties['height']
  corner?: keyof typeof radius
  style?: CSSProperties
}

// Shimmering placeholder shown while content loads.
export function Skeleton({ width = '100%', height, corner = 'md', style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius[corner],
        background: `linear-gradient(90deg, ${color.surface} 25%, ${color.surfaceHover} 50%, ${color.surface} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s linear infinite',
        ...style,
      }}
    />
  )
}
