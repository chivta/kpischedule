import { MapPin } from 'lucide-react'
import type { Lesson, OwnerKind } from '../../api/types'
import { useT } from '../../i18n/useT'
import { shortName } from '../../lib/names'
import { nextDateOf, type IsoDate, type KyivClock, type Slot } from '../../lib/time'
import { clampLines, color, font, fontSize, radius, space, tagColor, tint } from '../../theme'
import { Chip } from '../ui/Chip'
import { Tilt } from '../ui/Tilt'
import { slotEndLabel } from './scheduleCells'
import type { LessonSelection } from './types'

const MAX_TILT_DEG = 5
const BACKGROUND_TINT = 12
const BORDER_TINT = 28
const ACCENT_WIDTH = 3
const NAME_LINES = 3
const NAME_LINE_HEIGHT = 1.3
const PAST_OPACITY = 0.5
const NOT_HELD_OPACITY = 0.45
const LIVE_DOT_SIZE = 7
const LIVE_PULSE = 'pulse-live 1.6s ease-in-out infinite'
const ICON_SIZE = 12
const SEPARATOR = ', '

type LessonState = 'live' | 'past' | 'upcoming'

interface LessonCardProps {
  lesson: Lesson
  // The date of the cell the card sits in.
  date: IsoDate
  slot: Slot
  kind: OwnerKind
  held: boolean
  clock: KyivClock
  onSelect: (selection: LessonSelection) => void
}

function stateOf(date: IsoDate, slot: Slot, clock: KyivClock): LessonState {
  if (date < clock.date) return 'past'
  if (date > clock.date) return 'upcoming'
  if (slot.end <= clock.minutes) return 'past'
  if (slot.start <= clock.minutes) return 'live'
  return 'upcoming'
}

// One lesson in a week cell or a day list. Click selects it for the dialog.
export function LessonCard({ lesson, date, slot, kind, held, clock, onSelect }: LessonCardProps) {
  const { t, dayMonth } = useT()
  const tone = tagColor[lesson.tag]
  const state = stateOf(date, slot, clock)

  const sortedDates = [...lesson.dates].sort()
  const position = held && sortedDates.length > 0 ? sortedDates.indexOf(date) + 1 : 0
  const next = held ? null : nextDateOf(lesson, clock.date)

  const subline =
    kind === 'group'
      ? lesson.lecturer
        ? shortName(lesson.lecturer.name)
        : null
      : lesson.groups.map((group) => group.name).join(SEPARATOR) || null

  let opacity = 1
  if (!held) opacity = NOT_HELD_OPACITY
  else if (state === 'past') opacity = PAST_OPACITY

  return (
    <Tilt maxTiltDeg={MAX_TILT_DEG} style={{ borderRadius: radius.md }}>
      <button
        type="button"
        data-testid="lesson-card"
        data-tag={lesson.tag}
        data-held={held}
        data-state={state}
        aria-label={`${lesson.name}, ${lesson.time}-${slotEndLabel(slot)}`}
        onClick={() => onSelect({ lesson, date })}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          overflow: 'hidden',
          textAlign: 'left',
          padding: space.sm,
          paddingLeft: space.sm + ACCENT_WIDTH,
          borderRadius: radius.md,
          background: tint(tone, BACKGROUND_TINT),
          border: `1px ${held ? 'solid' : 'dashed'} ${tint(tone, BORDER_TINT)}`,
          boxShadow: state === 'live' && held ? `0 0 0 1px ${color.live}` : 'none',
          opacity,
        }}
      >
        <span
          aria-hidden
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: ACCENT_WIDTH, background: tone }}
        />
        <span style={{ display: 'flex', alignItems: 'center', gap: space.xs, marginBottom: space.xs }}>
          {state === 'live' && held && (
            <span
              aria-hidden
              style={{
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: radius.pill,
                background: color.live,
                animation: LIVE_PULSE,
                flexShrink: 0,
              }}
            />
          )}
          <Chip tone={tone}>{t(`tagShort.${lesson.tag}`)}</Chip>
          {position > 0 && (
            <span style={{ fontFamily: font.mono, fontSize: fontSize.xs, color: color.textMuted }}>
              {position}/{sortedDates.length}
            </span>
          )}
          {lesson.location && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: space.xxs,
                marginLeft: 'auto',
                minWidth: 0,
                fontSize: fontSize.xs,
                color: color.textMuted,
              }}
            >
              <MapPin size={ICON_SIZE} aria-hidden style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lesson.location.title}
              </span>
            </span>
          )}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: fontSize.sm,
            fontWeight: 600,
            lineHeight: NAME_LINE_HEIGHT,
            color: color.text,
            overflowWrap: 'anywhere',
            ...clampLines(NAME_LINES),
          }}
        >
          {lesson.name}
        </span>
        {!held && (
          <span style={{ display: 'block', marginTop: space.xxs, fontSize: fontSize.xs, color: color.textMuted }}>
            {next ? t('schedule.nextOn', { date: dayMonth(next) }) : t('schedule.notHeld')}
          </span>
        )}
        {subline && (
          <span
            style={{
              display: 'block',
              marginTop: space.xxs,
              fontSize: fontSize.xs,
              color: color.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subline}
          </span>
        )}
      </button>
    </Tilt>
  )
}
