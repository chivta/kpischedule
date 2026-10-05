import { motion, useMotionTemplate, useMotionValue, useSpring, type HTMLMotionProps } from 'motion/react'
import type { PointerEvent, ReactNode } from 'react'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

const DEFAULT_MAX_TILT_DEG = 7
const PERSPECTIVE_PX = 900
const GLARE_RADIUS_PX = 260
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 }

interface TiltProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  maxTiltDeg?: number
  children?: ReactNode
}

// Leans its content toward the mouse in 3D and lights the spot under the cursor.
// Children can set `transform: translateZ(..)` to float above the surface.
// Touch input and reduced-motion users get a flat element.
export function Tilt({ maxTiltDeg = DEFAULT_MAX_TILT_DEG, style, children, ...rest }: TiltProps) {
  const reducedMotion = usePrefersReducedMotion()
  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  const glareOpacity = useSpring(0, SPRING)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(${GLARE_RADIUS_PX}px circle at ${glareX}% ${glareY}%, var(--glow), transparent 70%)`

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    rotateY.set((x - 0.5) * 2 * maxTiltDeg)
    rotateX.set((0.5 - y) * 2 * maxTiltDeg)
    glareX.set(x * 100)
    glareY.set(y * 100)
    glareOpacity.set(1)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glareOpacity.set(0)
  }

  return (
    <motion.div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        position: 'relative',
        transformPerspective: PERSPECTIVE_PX,
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        ...style,
      }}
      {...rest}
    >
      {children}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: glare,
          opacity: glareOpacity,
        }}
      />
    </motion.div>
  )
}
