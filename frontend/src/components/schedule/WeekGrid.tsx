import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { Lesson, OwnerKind } from '../../api/types'
import { useT } from '../../i18n/useT'
import type { IsoDate, KyivClock, Slot, WeekAnchor } from '../../lib/time'
import { EASE_OUT, color, duration, font, fontSize, radius, space, tint } from '../../theme'
import { Button } from '../ui/Button'
import { Glass } from '../ui/Glass'
import { LessonCard } from './LessonCard'
import { cellLessons, slotEndLabel } from './scheduleCells'
import type { LessonSelection } from './types'

const GUTTER_WIDTH = 72
const CELL_MIN_HEIGHT = 72
const CARD_GAP = 6
const COLLAPSED_CARDS = 2
const ENTER_RISE_PX = 8
const ENTER_STAGGER_S = 0.04
const TODAY_GLOW_PERCENT = 35
const TODAY_GLOW_BLEED = space.xxs
const HEADER_PADDING_Y = space.xs
const DAY_NUMBER_SIZE = 22
const PAIR_NUMBER_SIZE = 20
const HEADER_ROW = 1
const FIRST_DAY_COLUMN = 2
const MORE_BUTTON_HEIGHT = 28

interface WeekGridProps {
  monday: IsoDate
  dates: IsoDate[]
  lessons: Lesson[]
  slots: Slot[]
  anchor: WeekAnchor
  kind: OwnerKind
  clock: KyivClock
  showAll: boolean
  onSelect: (selection: LessonSelection) => void
}

// Six-day timetable for wide screens. Rows span the pairs that have lessons this week.
export function WeekGrid(props: WeekGridProps) {
  return (
    <Glass style={{ padding: space.md }}>
      <WeekRows key={props.monday} {...props} />
    </Glass>
  )
}

// Remounted per week so expanded cells reset and cards animate in again.
function WeekRows({ dates, lessons, slots, anchor, kind, clock, showAll, onSelect }: WeekGridProps) {
  const { t, weekday } = useT()
  const reducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const cells = slots.map((slot) => dates.map((date) => cellLessons(lessons, date, slot, anchor, showAll)))
  const usedRows = cells.flatMap((row, index) => (row.some((cell) => cell.length > 0) ? [index] : []))
  const first = usedRows[0]
  const last = usedRows[usedRows.length - 1]

  if (usedRows.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: color.textMuted, padding: `${space.xl}px 0` }}>
        {t('schedule.noLessonsWeek')}
      </p>
    )
  }

  const rowSlots = slots.slice(first, last + 1)
  const todayColumn = dates.indexOf(clock.date)

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${dates.length}, minmax(0, 1fr))`,
        columnGap: space.xs,
        rowGap: space.xs,
        position: 'relative',
      }}
    >
      {todayColumn >= 0 && (
        <div
          aria-hidden
          style={{
            gridColumn: todayColumn + FIRST_DAY_COLUMN,
            gridRow: `${HEADER_ROW} / span ${rowSlots.length + 1}`,
            margin: `0 -${TODAY_GLOW_BLEED}px`,
            borderRadius: radius.md,
            background: `linear-gradient(to bottom, ${tint('var(--glow)', TODAY_GLOW_PERCENT)}, transparent)`,
          }}
        />
      )}
      {dates.map((date, column) => {
        const isToday = date === clock.date
        return (
          <div
            key={date}
            data-testid="day-column"
            data-date={date}
            data-today={isToday}
            style={{
              gridColumn: column + FIRST_DAY_COLUMN,
              gridRow: HEADER_ROW,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${HEADER_PADDING_Y}px 0`,
              borderRadius: radius.md,
              background: isToday ? color.text : 'transparent',
              color: isToday ? color.inverse : color.text,
            }}
          >
            <span
              style={{
                fontSize: fontSize.xs,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isToday ? color.inverse : color.textMuted,
              }}
            >
              {weekday(date, 'short')}
            </span>
            <span style={{ fontFamily: font.display, fontSize: DAY_NUMBER_SIZE, fontWeight: 600 }}>
              {Number(date.slice(-2))}
            </span>
          </div>
        )
      })}
      {rowSlots.map((slot, rowIndex) => {
        const row = HEADER_ROW + 1 + rowIndex
        return [
          <div
            key={`gutter-${slot.time}`}
            style={{
              gridColumn: 1,
              gridRow: row,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: space.xs,
              fontFamily: font.mono,
            }}
          >
            <span style={{ fontSize: PAIR_NUMBER_SIZE, fontWeight: 600 }}>{slot.number}</span>
            <span style={{ fontSize: fontSize.xs, color: color.textMuted }}>{slot.time}</span>
            <span style={{ fontSize: fontSize.xs, color: color.textMuted }}>{slotEndLabel(slot)}</span>
          </div>,
          ...dates.map((date, column) => {
            const items = cells[first + rowIndex][column]
            const id = `${date}|${slot.time}`
            const isOpen = expanded.has(id)
            const shown = isOpen ? items : items.slice(0, COLLAPSED_CARDS)
            const hiddenCount = items.length - shown.length
            return (
              <motion.div
                key={id}
                initial={reducedMotion ? false : { opacity: 0, y: ENTER_RISE_PX }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.base, ease: EASE_OUT, delay: column * ENTER_STAGGER_S }}
                style={{
                  gridColumn: column + FIRST_DAY_COLUMN,
                  gridRow: row,
                  position: 'relative',
                  minHeight: CELL_MIN_HEIGHT,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: CARD_GAP,
                  minWidth: 0,
                }}
              >
                {shown.map(({ lesson, held }) => (
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
                {items.length > COLLAPSED_CARDS && (
                  <Button
                    variant="ghost"
                    onClick={() => toggle(id)}
                    aria-expanded={isOpen}
                    style={{ height: MORE_BUTTON_HEIGHT, fontSize: fontSize.xs, color: color.textMuted }}
                  >
                    {isOpen ? t('schedule.less') : t('schedule.more', { n: hiddenCount })}
                  </Button>
                )}
              </motion.div>
            )
          }),
        ]
      })}
    </div>
  )
}
