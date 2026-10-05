import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type TouchEvent } from 'react'
import type { Lesson, OwnerKind } from '../../api/types'
import { useT } from '../../i18n/useT'
import type { IsoDate, KyivClock, Slot, WeekAnchor } from '../../lib/time'
import { EASE_OUT, color, duration, font, fontSize, radius, space } from '../../theme'
import { Glass } from '../ui/Glass'
import { LessonCard } from './LessonCard'
import { cellLessons, slotEndLabel } from './scheduleCells'
import type { LessonSelection } from './types'

const MAX_DOTS = 4
const DOT_SIZE = 5
const DOT_GAP = 3
const LIST_MIN_HEIGHT = 160
const SWIPE_THRESHOLD_PX = 60
const SLIDE_PX = 28
const TIME_COLUMN_WIDTH = 56
const CARD_GAP = 6
const DAY_NUMBER_SIZE = 20
const FIRST_DAY = 0
const LAST_DAY = 5
const WEEK_FORWARD = 1
const WEEK_BACK = -1

interface DayViewProps {
  dates: IsoDate[]
  lessons: Lesson[]
  slots: Slot[]
  anchor: WeekAnchor
  kind: OwnerKind
  clock: KyivClock
  showAll: boolean
  // Moves the shown week by `delta` weeks, used when a swipe passes the week edge.
  onShiftWeek: (delta: number) => void
  onSelect: (selection: LessonSelection) => void
}

// One-day-at-a-time schedule for phones: a day strip on top, the day's pairs below.
export function DayView({ dates, lessons, slots, anchor, kind, clock, showAll, onShiftWeek, onSelect }: DayViewProps) {
  const { t, weekday } = useT()
  const todayIndex = dates.indexOf(clock.date)
  const [selected, setSelected] = useState(() => Math.max(todayIndex, FIRST_DAY))
  // 1 when the last move went forward, for the slide direction.
  const [direction, setDirection] = useState(1)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const date = dates[selected]
  const rows = slots
    .map((slot) => ({ slot, items: cellLessons(lessons, date, slot, anchor, showAll) }))
    .filter((row) => row.items.length > 0)

  const select = (index: number) => {
    setDirection(index >= selected ? 1 : -1)
    setSelected(index)
  }

  const step = (delta: number) => {
    const target = selected + delta
    if (target > LAST_DAY) {
      setDirection(1)
      setSelected(FIRST_DAY)
      onShiftWeek(WEEK_FORWARD)
    } else if (target < FIRST_DAY) {
      setDirection(-1)
      setSelected(LAST_DAY)
      onShiftWeek(WEEK_BACK)
    } else select(target)
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return
    step(dx < 0 ? 1 : -1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
      <div style={{ display: 'flex', gap: space.xxs }}>
        {dates.map((tabDate, index) => {
          const isSelected = index === selected
          const isToday = tabDate === clock.date
          const dayCount = Math.min(
            MAX_DOTS,
            slots.reduce((sum, slot) => sum + cellLessons(lessons, tabDate, slot, anchor, false).length, 0),
          )
          return (
            <button
              key={tabDate}
              type="button"
              data-testid="day-tab"
              data-date={tabDate}
              aria-pressed={isSelected}
              onClick={() => select(index)}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space.xxs,
                padding: `${space.xs}px 0`,
                borderRadius: radius.md,
                background: isSelected ? color.text : color.surface,
                color: isSelected ? color.inverse : color.text,
                border: `1px solid ${isToday && !isSelected ? color.borderStrong : color.border}`,
                boxShadow: isToday && !isSelected ? `0 0 0 1px ${color.borderStrong}` : 'none',
              }}
            >
              <span
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: isSelected ? color.inverse : color.textMuted,
                }}
              >
                {weekday(tabDate, 'short')}
              </span>
              <span style={{ fontFamily: font.display, fontSize: DAY_NUMBER_SIZE, fontWeight: 600 }}>
                {Number(tabDate.slice(-2))}
              </span>
              <span aria-hidden style={{ display: 'flex', gap: DOT_GAP, height: DOT_SIZE }}>
                {Array.from({ length: dayCount }, (_, dot) => (
                  <span
                    key={dot}
                    style={{
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      borderRadius: radius.pill,
                      background: isSelected ? color.inverse : color.textMuted,
                    }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ touchAction: 'pan-y', minHeight: LIST_MIN_HEIGHT }}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={date}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * SLIDE_PX }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: -dir * SLIDE_PX }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: duration.fast, ease: EASE_OUT }}
            style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}
          >
            {rows.length === 0 && (
              <Glass style={{ padding: space.lg, textAlign: 'center', color: color.textMuted }}>
                {t('schedule.noLessonsDay')}
              </Glass>
            )}
            {rows.map(({ slot, items }) => (
              <div key={slot.time} style={{ display: 'flex', gap: space.sm }}>
                <div style={{ width: TIME_COLUMN_WIDTH, flexShrink: 0, paddingTop: space.xs }}>
                  <div style={{ fontFamily: font.mono, fontWeight: 600 }}>{slot.time}</div>
                  <div style={{ fontFamily: font.mono, fontSize: fontSize.sm, color: color.textMuted }}>
                    {slotEndLabel(slot)}
                  </div>
                  <div style={{ fontSize: fontSize.xs, color: color.textMuted }}>
                    {t('schedule.pair', { n: slot.number })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: CARD_GAP }}>
                  {items.map(({ lesson, held }) => (
                    <LessonCard
                      key={lesson.key}
                      lesson={lesson}
                      date={date}
                      slot={slot}
                      kind={kind}
                      held={held}
                      clock={clock}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
