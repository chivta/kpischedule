import { WifiOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { OwnerKind } from '../api/types'
import { ExamsList } from '../components/schedule/ExamsList'
import { LessonDialog } from '../components/schedule/LessonDialog'
import { NowPanel } from '../components/schedule/NowPanel'
import { DayView } from '../components/schedule/DayView'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import type { LessonSelection } from '../components/schedule/types'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { WeekToolbar } from '../components/schedule/WeekToolbar'
import { Button } from '../components/ui/Button'
import { Glass } from '../components/ui/Glass'
import { Segmented } from '../components/ui/Segmented'
import { Skeleton } from '../components/ui/Skeleton'
import { MINUTE_MS } from '../hooks/useCachedQuery'
import { useKyivClock } from '../hooks/useKyivClock'
import { useIsCompact } from '../hooks/useMediaQuery'
import { useScheduleData } from '../hooks/useScheduleData'
import { useT } from '../i18n/useT'
import type { TranslationKey } from '../i18n/translations'
import {
  hiddenSubjectsStore,
  hideSubject,
  restoreSubjects,
  scheduleKey,
  showAllStore,
  useStore,
} from '../lib/storage'
import {
  DAYS_PER_WEEK,
  SUNDAY_INDEX,
  addDays,
  mondayOf,
  studyDatesOf,
  weekNumberOf,
} from '../lib/time'
import { color, fontSize, space } from '../theme'

type Tab = 'week' | 'exams'

const NO_HIDDEN: string[] = []
const UPDATED_FORMAT = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const STATUS_ICON_SIZE = 14
const HEADER_SKELETON_HEIGHT = 96
const NOW_SKELETON_HEIGHT = 120
const GRID_SKELETON_HEIGHT = 520
const TOOLBAR_SKELETON_HEIGHT = 42
const ERROR_MIN_HEIGHT = 240

// Schedule of one group or lecturer, read from the route id.
export function SchedulePage({ kind }: { kind: OwnerKind }) {
  const { id = '' } = useParams()
  return <ScheduleView key={`${kind}:${id}`} kind={kind} id={id} />
}

function ScheduleView({ kind, id }: { kind: OwnerKind; id: string }) {
  const { t } = useT()
  const compact = useIsCompact()
  const clock = useKyivClock(MINUTE_MS)
  const data = useScheduleData(kind, id)
  const { owner, lessons, profile, slots, anchor, loading, error, updatedAt } = data
  const showAll = useStore(showAllStore)
  const hiddenMap = useStore(hiddenSubjectsStore)
  const key = scheduleKey({ kind, id })
  const hidden = hiddenMap[key] ?? NO_HIDDEN

  const [weekOffset, setWeekOffset] = useState(0)
  const [tab, setTab] = useState<Tab>('week')
  const [selection, setSelection] = useState<LessonSelection | null>(null)

  const visibleLessons = useMemo(() => lessons.filter((lesson) => !hidden.includes(lesson.name)), [lessons, hidden])

  useEffect(() => {
    if (owner) document.title = `${owner.name} · ${t('app.name')}`
  }, [owner, t])

  const shiftWeek = useCallback((delta: number) => setWeekOffset((offset) => offset + delta), [])
  const resetWeek = useCallback(() => setWeekOffset(0), [])

  const defaultMonday = mondayOf(clock.dayIndex === SUNDAY_INDEX ? addDays(clock.date, 1) : clock.date)
  const monday = addDays(defaultMonday, weekOffset * DAYS_PER_WEEK)
  const dates = studyDatesOf(monday)

  if (loading) return <PageSkeleton />

  if (error && lessons.length === 0) {
    return (
      <Glass
        data-testid="schedule-error"
        style={{ ...stateStyle, ...centered }}
      >
        <p>{t(`error.${error}` as TranslationKey)}</p>
        <Button onClick={() => window.location.reload()}>{t('error.retry')}</Button>
      </Glass>
    )
  }

  if (lessons.length === 0) {
    return (
      <Glass data-testid="schedule-empty" style={{ ...stateStyle, ...centered }}>
        <p style={{ fontSize: fontSize.lg, fontWeight: 600 }}>{t('schedule.empty')}</p>
        <p style={{ color: color.textMuted }}>{t('schedule.emptyHint')}</p>
      </Glass>
    )
  }

  const tabs = [
    { value: 'week' as const, label: t('schedule.tab.week') },
    ...(kind === 'group' ? [{ value: 'exams' as const, label: t('schedule.tab.exams') }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg, paddingTop: space.xl }}>
      <ScheduleHeader kind={kind} owner={owner} profile={profile} />
      {anchor && visibleLessons.length > 0 && (
        <NowPanel lessons={visibleLessons} slots={slots} anchor={anchor} kind={kind} onSelect={setSelection} />
      )}
      {kind === 'group' && (
        <div>
          <Segmented options={tabs} value={tab} onChange={setTab} label={t('schedule.tab.week')} />
        </div>
      )}
      {tab === 'exams' && kind === 'group' ? (
        <ExamsList groupId={id} />
      ) : anchor ? (
        <>
          <WeekToolbar
            monday={monday}
            weekNumber={weekNumberOf(anchor, monday)}
            weekOffset={weekOffset}
            onShiftWeek={shiftWeek}
            onToday={resetWeek}
            hiddenCount={hidden.length}
            onRestoreHidden={() => restoreSubjects(key)}
          />
          {compact ? (
            <DayView
              dates={dates}
              lessons={visibleLessons}
              slots={slots}
              anchor={anchor}
              kind={kind}
              clock={clock}
              showAll={showAll}
              onShiftWeek={shiftWeek}
              onSelect={setSelection}
            />
          ) : (
            <WeekGrid
              monday={monday}
              dates={dates}
              lessons={visibleLessons}
              slots={slots}
              anchor={anchor}
              kind={kind}
              clock={clock}
              showAll={showAll}
              onSelect={setSelection}
            />
          )}
        </>
      ) : (
        <GridSkeleton />
      )}
      {error ? (
        <p
          data-testid="offline-note"
          style={{ ...statusStyle, display: 'flex', alignItems: 'center', gap: space.xs }}
        >
          <WifiOff size={STATUS_ICON_SIZE} aria-hidden />
          {t('schedule.offline')}
        </p>
      ) : (
        updatedAt !== null && (
          <p style={statusStyle}>{t('schedule.updated', { time: UPDATED_FORMAT.format(updatedAt) })}</p>
        )
      )}
      <LessonDialog
        selection={selection}
        slots={slots}
        kind={kind}
        onClose={() => setSelection(null)}
        onHideSubject={(subject) => {
          hideSubject(key, subject)
          setSelection(null)
        }}
      />
    </div>
  )
}

const statusStyle = { fontSize: fontSize.xs, color: color.textMuted } as const
const stateStyle = { padding: space.xl, marginTop: space.xl, minHeight: ERROR_MIN_HEIGHT } as const
const centered = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space.md,
  textAlign: 'center',
} as const

function GridSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
      <Skeleton height={TOOLBAR_SKELETON_HEIGHT} corner="pill" />
      <Skeleton height={GRID_SKELETON_HEIGHT} corner="lg" />
    </div>
  )
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg, paddingTop: space.xl }}>
      <Skeleton height={HEADER_SKELETON_HEIGHT} corner="lg" />
      <Skeleton height={NOW_SKELETON_HEIGHT} corner="lg" />
      <GridSkeleton />
    </div>
  )
}
