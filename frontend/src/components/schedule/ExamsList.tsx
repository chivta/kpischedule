import { MapPin, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ApiExam } from '../../api/types'
import { MINUTE_MS } from '../../hooks/useCachedQuery'
import { useKyivClock } from '../../hooks/useKyivClock'
import { useExams } from '../../hooks/useScheduleData'
import { useT } from '../../i18n/useT'
import { schedulePath } from '../../lib/routes'
import { daysBetween, type IsoDate } from '../../lib/time'
import { color, font, fontSize, space } from '../../theme'
import { Chip } from '../ui/Chip'
import { Glass } from '../ui/Glass'
import { Skeleton } from '../ui/Skeleton'
import type { ExamsListProps } from './types'

const DATE_LENGTH = 'YYYY-MM-DD'.length
const TIME_START = 'YYYY-MM-DDT'.length
const TIME_END = 'YYYY-MM-DDTHH:mm'.length
const DAY_START = 'YYYY-MM-'.length
const DAY_NUMBER_SIZE = 30
const DATE_BLOCK_WIDTH = 64
const META_ICON_SIZE = 13
const PASSED_OPACITY = 0.5
const SKELETON_HEIGHT = 92
const SKELETON_COUNT = 2

// One exam row: date block, subject with lecturer and room, countdown chip.
function ExamCard({ exam, today }: { exam: ApiExam; today: IsoDate }) {
  const { t, tn, weekday, dayMonth } = useT()
  const date = exam.date.slice(0, DATE_LENGTH)
  const time = exam.date.slice(TIME_START, TIME_END)
  const daysLeft = daysBetween(today, date)

  const countdown =
    daysLeft === 0 ? (
      <Chip tone={color.live}>{t('exams.today')}</Chip>
    ) : daysLeft < 0 ? (
      <Chip>{t('exams.passed')}</Chip>
    ) : (
      <Chip tone="var(--lec)">{tn('exams.in', daysLeft)}</Chip>
    )

  return (
    <Glass
      data-testid="exam-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space.md,
        padding: space.md,
        opacity: daysLeft < 0 ? PASSED_OPACITY : 1,
      }}
    >
      <div style={{ width: DATE_BLOCK_WIDTH, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: font.display, fontSize: DAY_NUMBER_SIZE, fontWeight: 700, lineHeight: 1 }}>
          {Number(date.slice(DAY_START))}
        </div>
        <div style={{ marginTop: space.xxs, fontSize: fontSize.xs, color: color.textMuted, textTransform: 'uppercase' }}>
          {weekday(date, 'short')}
        </div>
        <div style={{ fontFamily: font.mono, fontSize: fontSize.xs, color: color.textMuted }}>{time}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xxs }}>
        <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{exam.subject}</span>
        <span style={{ fontSize: fontSize.sm, color: color.textMuted }}>
          {dayMonth(date)}, {weekday(date, 'long')}
        </span>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${space.xxs}px ${space.md}px`,
            fontSize: fontSize.sm,
            color: color.textMuted,
          }}
        >
          {exam.lecturerName && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.xxs }}>
              <User size={META_ICON_SIZE} aria-hidden />
              {exam.lecturerId ? (
                <Link
                  to={schedulePath({ kind: 'lecturer', id: exam.lecturerId })}
                  style={{ color: color.text, textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {exam.lecturerName}
                </Link>
              ) : (
                exam.lecturerName
              )}
            </span>
          )}
          {exam.room && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.xxs }}>
              <MapPin size={META_ICON_SIZE} aria-hidden />
              {exam.room}
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{countdown}</div>
    </Glass>
  )
}

// The exams tab of a group schedule, soonest first.
export function ExamsList({ groupId }: ExamsListProps) {
  const { t } = useT()
  const clock = useKyivClock(MINUTE_MS)
  const { exams, loading } = useExams(groupId)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Skeleton key={index} height={SKELETON_HEIGHT} corner="lg" />
        ))}
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <Glass data-testid="exams-empty" style={{ padding: space.xl, textAlign: 'center' }}>
        <p style={{ fontWeight: 600 }}>{t('exams.empty')}</p>
        <p style={{ marginTop: space.xxs, color: color.textMuted, fontSize: fontSize.sm }}>{t('exams.emptyHint')}</p>
      </Glass>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} today={clock.date} />
      ))}
    </div>
  )
}
