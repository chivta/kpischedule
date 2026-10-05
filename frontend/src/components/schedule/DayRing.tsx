import { motion } from 'motion/react'
import type { Lesson } from '../../api/types'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/useT'
import type { CurrentPair, KyivClock, Slot, UpcomingPair } from '../../lib/time'
import { MINUTES_PER_HOUR } from '../../lib/time'
import { color, font, fontSize, tagColor } from '../../theme'
import { Tilt } from '../ui/Tilt'
import { formatMinutes } from './scheduleCells'

const VIEWBOX = 200
const CENTER = VIEWBOX / 2
const STROKE = 12
const LIVE_STROKE = 17
const RADIUS = CENTER - LIVE_STROKE
const GAP_DEG = 9
const FULL_TURN_DEG = 360
// Degrees one round cap adds at each end of an arc.
const CAP_DEG = ((STROKE / 2 / RADIUS) * 180) / Math.PI
const PAST_OPACITY = 0.35
const EMPTY_OPACITY = 0.7
const PROGRESS_TRANSITION = 'stroke-dasharray 1s linear'
const LIVE_GLOW_PX = 7

const MAX_TILT_DEG = 14
const HALO_DEPTH_PX = -40
const HALO_INSET_PX = 14
const HALO_BLUR_PX = 26
const HALO_OPACITY = 0.55
const TEXT_DEPTH_PX = 36
const FLOAT_PX = 6
const FLOAT_SECONDS = 6

const BIG_NUMBER_RATIO = 0.25
const UNIT_RATIO = 0.075

interface DayRingProps {
  slots: Slot[]
  // Lessons held today, used to color the arcs.
  today: Lesson[]
  clock: KyivClock
  current: CurrentPair | null
  next: UpcomingPair | null
  size: number
}

interface CenterText {
  value: string
  unit: string
  label: string
  mono: boolean
}

function formatCountdown(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = String(minutes % MINUTES_PER_HOUR).padStart(2, '0')
  return `${hours}:${rest}`
}

// Dial of today's pairs for the now panel. One arc per slot, the running one fills as time passes.
export function DayRing({ slots, today, clock, current, next, size }: DayRingProps) {
  const { t } = useT()
  const reducedMotion = usePrefersReducedMotion()
  const minuteUnit = t('duration.minutes', { m: '' }).trim()

  const arcDeg = (FULL_TURN_DEG - GAP_DEG * slots.length) / Math.max(1, slots.length)
  const dashDeg = Math.max(0, arcDeg - 2 * CAP_DEG)

  const center: CenterText = (() => {
    if (current) return { value: String(current.minutesLeft), unit: minuteUnit, label: t('now.current'), mono: false }
    if (next && next.daysAhead === 0) {
      return next.minutesUntil < MINUTES_PER_HOUR
        ? { value: String(next.minutesUntil), unit: minuteUnit, label: t('now.next'), mono: false }
        : { value: formatCountdown(next.minutesUntil), unit: '', label: t('now.next'), mono: true }
    }
    return { value: formatMinutes(clock.minutes), unit: '', label: t('schedule.kyivTime'), mono: true }
  })()

  const haloColors = slots
    .map((slot) => today.find((lesson) => lesson.time === slot.time))
    .filter((lesson): lesson is Lesson => lesson !== undefined)
    .map((lesson) => tagColor[lesson.tag])
  const halo = haloColors.length > 0 ? [...haloColors, haloColors[0]] : ['var(--glow)', 'var(--glow)']

  return (
    <motion.div
      aria-hidden
      animate={reducedMotion ? undefined : { y: [0, -FLOAT_PX, 0] }}
      transition={{ duration: FLOAT_SECONDS, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <Tilt maxTiltDeg={MAX_TILT_DEG} style={{ width: size, height: size, borderRadius: '50%' }}>
        <div
          style={{
            position: 'absolute',
            inset: HALO_INSET_PX,
            borderRadius: '50%',
            background: `conic-gradient(${halo.join(', ')})`,
            filter: `blur(${HALO_BLUR_PX}px)`,
            opacity: HALO_OPACITY,
            transform: `translateZ(${HALO_DEPTH_PX}px)`,
          }}
        />
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          width={size}
          height={size}
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {slots.map((slot, index) => {
            const lesson = today.find((item) => item.time === slot.time)
            const live = current?.slot.number === slot.number
            const ended = slot.end <= clock.minutes
            const tone = lesson ? tagColor[lesson.tag] : color.border
            const offset = -(index * (arcDeg + GAP_DEG) + CAP_DEG)
            const common = {
              cx: CENTER,
              cy: CENTER,
              r: RADIUS,
              fill: 'none',
              pathLength: FULL_TURN_DEG,
              strokeLinecap: 'round' as const,
              strokeDashoffset: offset,
            }
            return (
              <g key={slot.number}>
                <circle
                  {...common}
                  stroke={tone}
                  strokeWidth={live ? LIVE_STROKE : STROKE}
                  strokeDasharray={`${dashDeg} ${FULL_TURN_DEG}`}
                  opacity={live ? PAST_OPACITY * 2 : ended && lesson ? PAST_OPACITY : lesson ? 1 : EMPTY_OPACITY}
                />
                {live && current && (
                  <circle
                    {...common}
                    stroke={tone}
                    strokeWidth={LIVE_STROKE}
                    strokeDasharray={`${dashDeg * current.progress} ${FULL_TURN_DEG}`}
                    style={{ transition: PROGRESS_TRANSITION, filter: `drop-shadow(0 0 ${LIVE_GLOW_PX}px ${tone})` }}
                  />
                )}
              </g>
            )
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateZ(${TEXT_DEPTH_PX}px)`,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: center.mono ? font.mono : font.display,
              fontSize: Math.round(size * (center.mono ? BIG_NUMBER_RATIO * 0.8 : BIG_NUMBER_RATIO)),
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: center.mono ? 0 : '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {center.value}
          </span>
          {center.unit && (
            <span style={{ fontSize: Math.round(size * UNIT_RATIO), color: color.textMuted, fontWeight: 600 }}>
              {center.unit}
            </span>
          )}
          <span
            style={{
              marginTop: 4,
              fontSize: fontSize.xs,
              color: color.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {center.label}
          </span>
        </div>
      </Tilt>
    </motion.div>
  )
}
