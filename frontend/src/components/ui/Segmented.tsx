import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { color, duration, fontSize, radius, space } from '../../theme'

const SEGMENT_HEIGHT = 36

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  // Names the group for screen readers.
  label: string
}

// Tab-style switch. The highlight slides to the selected option.
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  const layoutId = useId()
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{
        display: 'inline-flex',
        padding: space.xxs,
        borderRadius: radius.pill,
        background: color.surface,
        border: `1px solid ${color.border}`,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: space.xs,
              height: SEGMENT_HEIGHT,
              padding: `0 ${space.md}px`,
              borderRadius: radius.pill,
              color: selected ? color.text : color.textMuted,
              fontSize: fontSize.md,
              fontWeight: 600,
              transition: `color ${duration.fast}s ease`,
            }}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: radius.pill,
                  background: color.surfaceHover,
                  border: `1px solid ${color.border}`,
                }}
              />
            )}
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: space.xs }}>
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
