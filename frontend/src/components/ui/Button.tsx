import { motion, type HTMLMotionProps } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useHover } from '../../hooks/useHover'
import { color, duration, font, fontSize, radius, space } from '../../theme'

const CONTROL_HEIGHT = 42
const TAP_SCALE = 0.96

type Variant = 'solid' | 'glass' | 'ghost'

const background: Record<Variant, { rest: string; hover: string }> = {
  solid: { rest: color.text, hover: color.text },
  glass: { rest: color.surface, hover: color.surfaceHover },
  ghost: { rest: 'transparent', hover: color.surface },
}

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  icon?: ReactNode
  // Marks a toggle as on.
  active?: boolean
  children?: ReactNode
}

// Text button with an optional leading icon.
export function Button({ variant = 'glass', icon, active = false, style, children, ...rest }: ButtonProps) {
  const { hovered, hoverProps } = useHover()
  const colors = background[variant]
  return (
    <motion.button
      type="button"
      whileTap={{ scale: TAP_SCALE }}
      {...hoverProps}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
        height: CONTROL_HEIGHT,
        padding: `0 ${space.md}px`,
        borderRadius: radius.pill,
        border: `1px solid ${variant === 'ghost' ? 'transparent' : active ? color.borderStrong : color.border}`,
        background: hovered || active ? colors.hover : colors.rest,
        color: variant === 'solid' ? color.inverse : color.text,
        fontFamily: font.body,
        fontSize: fontSize.md,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        transition: `background ${duration.fast}s ease, border-color ${duration.fast}s ease`,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  )
}

interface IconButtonProps extends HTMLMotionProps<'button'> {
  // Read by screen readers and shown as the tooltip.
  label: string
  active?: boolean
  children: ReactNode
}

function iconControlStyle(highlighted: boolean, active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    border: `1px solid ${active ? color.borderStrong : color.border}`,
    background: highlighted ? color.surfaceHover : color.surface,
    color: color.text,
    transition: `background ${duration.fast}s ease, border-color ${duration.fast}s ease`,
  }
}

// Round icon-only button.
export function IconButton({ label, active = false, style, children, ...rest }: IconButtonProps) {
  const { hovered, hoverProps } = useHover()
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: TAP_SCALE }}
      {...hoverProps}
      style={{ ...iconControlStyle(hovered || active, active), ...style }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

interface IconLinkProps extends HTMLMotionProps<'a'> {
  // Read by screen readers and shown as the tooltip.
  label: string
  href: string
  children: ReactNode
}

// Round icon-only link to an external page, opened in a new tab. Looks like IconButton.
export function IconLink({ label, href, style, children, ...rest }: IconLinkProps) {
  const { hovered, hoverProps } = useHover()
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      whileTap={{ scale: TAP_SCALE }}
      {...hoverProps}
      style={{ ...iconControlStyle(hovered, false), ...style }}
      {...rest}
    >
      {children}
    </motion.a>
  )
}
