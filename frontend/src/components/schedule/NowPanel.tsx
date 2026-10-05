import { MapPin } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Lesson, OwnerKind } from '../../api/types'
import { useHover } from '../../hooks/useHover'
import { useKyivClock } from '../../hooks/useKyivClock'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/useT'
import { shortName } from '../../lib/names'
import { computeNow, lessonsOn, type IsoDate, type UpcomingPair } from '../../lib/time'
import { clampLines, color, duration as motionDuration, font, fontSize, space, tagColor } from '../../theme'
import { Chip } from '../ui/Chip'
import { Glass } from '../ui/Glass'
import { DayRing } from './DayRing'
import { formatMinutes } from './scheduleCells'
import type { LessonSelection, NowPanelProps } from './types'

const RING_SIZE = 190
const RING_SIZE_COMPACT = 150
const LIVE_DOT_SIZE = 8
const LIVE_PULSE = 'pulse-live 1.6s ease-in-out infinite'
const META_ICON_SIZE = 14
const HEADLINE_SIZE = 'clamp(22px, 3vw, 34px)'
const HEADLINE_LINES = 2
const NEXT_NAME_LINES = 2
const SEPARATOR = ', '
const TOMORROW = 1

const eyebrow: CSSProperties = {
  fontSize: fontSize.xs,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: color.textMuted,
}

function whoLine(lesson: Lesson, kind: OwnerKind): string | null {
  if (kind === 'lecturer') return lesson.groups.map((group) => group.name).join(SEPARATOR) || null
  return lesson.lecturer ? shortName(lesson.lecturer.name) : null
}

interface LessonLinkProps {
  lesson: Lesson
  date: IsoDate
  onSelect: (selection: LessonSelection) => void
  style: CSSProperties
}

// A lesson name that opens the lesson dialog.
function LessonLink({ lesson, date, onSelect, style }: LessonLinkProps) {
  const { hovered, hoverProps } = useHover()
  return (
    <button
      type="button"
      onClick={() => onSelect({ lesson, date })}
      {...hoverProps}
      style={{
        textAlign: 'left',
        textDecorationLine: hovered ? 'underline' : 'none',
        textDecorationThickness: 1,
        textUnderlineOffset: 4,
        transition: `opacity ${motionDuration.fast}s ease`,
        ...style,
      }}
    >
      {lesson.name}
    </button>
  )
}

// Extra lessons sharing a slot, as "+N".
function MoreChip({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length < 2) return null
  return <Chip>+{lessons.length - 1}</Chip>
}

// What is running now and what comes next, above the week of a schedule page.
export function NowPanel({ lessons, slots, anchor, kind, onSelect }: NowPanelProps) {
  const { t, tn, weekday, duration } = useT()
  const compact = useIsCompact()
  const clock = useKyivClock()
  const { current, next, remainingToday } = computeNow(lessons, clock, anchor, slots)
  // The running pair is already on screen, so the count names only the ones after it.
  const laterToday = remainingToday - (current ? 1 : 0)
  const today = lessonsOn(lessons, clock.date, anchor)
  const endedToday = today.some((lesson) => {
    const slot = slots.find((item) => item.time === lesson.time)
    return slot !== undefined && slot.end <= clock.minutes
  })

  const nextWhen = (pair: UpcomingPair): string => {
    if (pair.daysAhead === 0) return `${t('now.in', { duration: duration(pair.minutesUntil) })} · ${pair.slot.time}`
    if (pair.daysAhead === TOMORROW) return t('now.tomorrowAt', { time: pair.slot.time })
    return t('now.dayAt', { day: weekday(pair.date, 'long'), time: pair.slot.time })
  }

  const headlineStyle: CSSProperties = {
    fontFamily: font.display,
    fontSize: HEADLINE_SIZE,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    ...clampLines(HEADLINE_LINES),
  }

  const renderHeadline = () => {
    if (current) {
      const lesson = current.lessons[0]
      const who = whoLine(lesson, kind)
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' }}>
            <span
              aria-hidden
              style={{
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: '50%',
                background: color.live,
                animation: LIVE_PULSE,
              }}
            />
            <span style={{ ...eyebrow, color: color.live }}>{t('now.current')}</span>
            <Chip>{t('schedule.pair', { n: current.slot.number })}</Chip>
            <MoreChip lessons={current.lessons} />
          </div>
          <div data-testid="now-headline" style={{ display: 'flex' }}>
            <LessonLink lesson={lesson} date={clock.date} onSelect={onSelect} style={headlineStyle} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${space.xxs}px ${space.md}px`, color: color.textMuted }}>
            {lesson.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.xxs }}>
                <MapPin size={META_ICON_SIZE} aria-hidden />
                {lesson.location.title}
              </span>
            )}
            {who && <span>{who}</span>}
            <span style={{ color: color.text, fontWeight: 600 }}>
              {t('now.left', { duration: duration(current.minutesLeft) })}
            </span>
          </div>
        </>
      )
    }

    const headline = !next
      ? t('now.nothing')
      : next.daysAhead === 0
        ? endedToday
          ? t('now.break')
          : t('now.beforeFirst')
        : today.length > 0
          ? t('now.done')
          : t('now.free')
    return (
      <>
        <h2 data-testid="now-headline" style={headlineStyle}>
          {headline}
        </h2>
        {next && next.daysAhead === 0 && (
          <span style={{ color: color.text, fontWeight: 600 }}>
            {t('now.in', { duration: duration(next.minutesUntil) })}
          </span>
        )}
      </>
    )
  }

  return (
    <Glass
      strong
      corner="xl"
      data-testid="now-panel"
      style={{
        display: 'flex',
        flexDirection: compact ? 'column' : 'row',
        alignItems: 'center',
        gap: compact ? space.lg : space.xl,
        padding: space.lg,
      }}
    >
      <DayRing
        slots={slots}
        today={today}
        clock={clock}
        current={current}
        next={next}
        size={compact ? RING_SIZE_COMPACT : RING_SIZE}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: compact ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
          gap: space.sm,
        }}
      >
        {renderHeadline()}

        {next && (
          <div
            data-testid="now-next"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: space.xxs,
              marginTop: space.xs,
              paddingTop: space.sm,
              borderTop: `1px solid ${color.border}`,
            }}
          >
            <span style={eyebrow}>{t('now.next')}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: space.xs, flexWrap: 'wrap' }}>
              <LessonLink
                lesson={next.lessons[0]}
                date={next.date}
                onSelect={onSelect}
                style={{ fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.3, ...clampLines(NEXT_NAME_LINES) }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, flexWrap: 'wrap', color: color.textMuted }}>
              <Chip tone={tagColor[next.lessons[0].tag]}>{t(`tagShort.${next.lessons[0].tag}`)}</Chip>
              <MoreChip lessons={next.lessons} />
              <span>{nextWhen(next)}</span>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: space.xs,
            flexWrap: 'wrap',
            marginTop: space.xxs,
            fontSize: fontSize.xs,
            color: color.textFaint,
          }}
        >
          <span style={{ fontFamily: font.mono, color: color.textMuted }}>{formatMinutes(clock.minutes)}</span>
          <span>{t('schedule.kyivTime')}</span>
          {laterToday > 0 && (
            // On phones the count takes its own line, so no separator dangles where it wraps.
            <span style={{ flexBasis: compact ? '100%' : undefined }}>
              {!compact && <span aria-hidden>· </span>}
              {tn('now.remaining', laterToday)}
            </span>
          )}
        </div>
      </div>
    </Glass>
  )
}
