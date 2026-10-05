import { motion, type HTMLMotionProps } from 'motion/react'
import { color, glass, radius } from '../../theme'

interface GlassProps extends HTMLMotionProps<'div'> {
  // A more opaque panel, for content that must stay readable over the 3D scene.
  strong?: boolean
  corner?: keyof typeof radius
}

// The frosted panel every floating surface is built from. Accepts motion props.
export function Glass({ strong = false, corner = 'lg', style, ...rest }: GlassProps) {
  return (
    <motion.div
      style={{
        ...glass,
        background: strong ? color.surfaceStrong : color.surface,
        borderRadius: radius[corner],
        ...style,
      }}
      {...rest}
    />
  )
}
