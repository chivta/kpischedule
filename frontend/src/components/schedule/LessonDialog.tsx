import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, CalendarDays, Clock, EyeOff, MapPin, User, Users, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MINUTE_MS } from '../../hooks/useCachedQuery'
import { useKyivClock } from '../../hooks/useKyivClock'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/useT'
import { schedulePath } from '../../lib/routes'
import { color, font, fontSize, glass, radius, space, tagColor, tint, zIndex } from '../../theme'
import { Button, IconButton } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { slotEndLabel } from './scheduleCells'
import type { LessonDialogProps } from './types'

const DIALOG_MAX_WIDTH = 520
const SHEET_MAX_HEIGHT = '85dvh'
const OVERLAY_BLUR_PX = 8
const ROW_ICON_SIZE = 18
const ROW_ICON_COLUMN = 26
const LINK_ICON_SIZE = 14
const CLOSE_ICON_SIZE = 18
const TITLE_SIZE = 22
const DATE_CHIP_TINT = 14
const HOVER_LINK_STYLE: CSSProperties = { textDecoration: 'underline', textUnderlineOffset: 3 }
const RANGE_DASH = '–'

// One labelled line of the dialog: a muted icon on the left, content on the right.
function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start' }}>
      <span style={{ width: ROW_ICON_COLUMN, flexShrink: 0, paddingTop: 2, color: color.textMuted }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xxs }}>{children}</div>
    </div>
  )
}

const faint: CSSProperties = { color: color.textFaint }
const small: CSSProperties = { fontSize: fontSize.sm, color: color.textMuted }

// Details of one lesson on one date, opened from a lesson card or the now panel.
export function LessonDialog({ selection, slots, kind, onClose, onHideSubject }: LessonDialogProps) {
  const { t, weekday, dayMonth } = useT()
  const compact = useIsCompact()
  const clock = useKyivClock(MINUTE_MS)

  if (!selection) return null
  const { lesson, date } = selection
  const tone = tagColor[lesson.tag]
  const slot = slots.find((item) => item.time === lesson.time)
  const sortedDates = [...lesson.dates].sort()
  const done = sortedDates.filter((item) => item < clock.date).length

  const contentStyle: CSSProperties = compact
    ? {
        width: '100%',
        maxHeight: SHEET_MAX_HEIGHT,
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
        paddingBottom: `calc(${space.lg}px + env(safe-area-inset-bottom))`,
      }
    : { width: '100%', maxWidth: DIALOG_MAX_WIDTH, borderRadius: radius.xl, margin: space.md }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex.overlay,
            display: 'flex',
            alignItems: compact ? 'flex-end' : 'center',
            justifyContent: 'center',
            background: color.overlay,
            backdropFilter: `blur(${OVERLAY_BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${OVERLAY_BLUR_PX}px)`,
            animation: 'fade-in 0.2s ease',
          }}
        >
          <Dialog.Content
            data-testid="lesson-dialog"
            style={{
              ...glass,
              background: color.bgRaised,
              zIndex: zIndex.dialog,
              overflowY: 'auto',
              padding: space.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: space.md,
              animation: 'sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              ...contentStyle,
            }}
            className="scroll-thin"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
              <Chip tone={tone}>{t(`tag.${lesson.tag}`)}</Chip>
              <Dialog.Close asChild>
                <IconButton label={t('lesson.close')}>
                  <X size={CLOSE_ICON_SIZE} aria-hidden />
                </IconButton>
              </Dialog.Close>
            </div>

            <Dialog.Title
              style={{
                fontFamily: font.display,
                fontSize: TITLE_SIZE,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {lesson.name}
            </Dialog.Title>

            <Row icon={<Clock size={ROW_ICON_SIZE} aria-hidden />}>
              <Dialog.Description style={{ margin: 0, fontWeight: 600 }}>
                {weekday(date, 'long')}, {dayMonth(date)}
              </Dialog.Description>
              <span style={small}>
                {slot && `${t('schedule.pair', { n: slot.number })} · `}
                <span style={{ fontFamily: font.mono }}>
                  {lesson.time}
                  {slot && ` ${RANGE_DASH} ${slotEndLabel(slot)}`}
                </span>
              </span>
            </Row>

            {kind === 'group' && (
              <Row icon={<User size={ROW_ICON_SIZE} aria-hidden />}>
                {lesson.lecturer ? (
                  <Link
                    data-testid="lesson-lecturer-link"
                    to={schedulePath({ kind: 'lecturer', id: lesson.lecturer.id })}
                    onClick={onClose}
                    style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <span style={{ fontWeight: 600, ...HOVER_LINK_STYLE }}>{lesson.lecturer.name}</span>
                    <span style={{ ...small, display: 'inline-flex', alignItems: 'center', gap: space.xxs }}>
                      {t('lesson.openLecturer')}
                      <ArrowUpRight size={LINK_ICON_SIZE} aria-hidden />
                    </span>
                  </Link>
                ) : (
                  <span style={faint}>{t('lesson.noLecturer')}</span>
                )}
              </Row>
            )}

            {kind === 'lecturer' && lesson.groups.length > 0 && (
              <Row icon={<Users size={ROW_ICON_SIZE} aria-hidden />}>
                <span style={small}>{t('lesson.groups')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
                  {lesson.groups.map((group) => (
                    <Link
                      key={group.id}
                      to={schedulePath({ kind: 'group', id: String(group.id) })}
                      onClick={onClose}
                      style={{
                        padding: `${space.xxs}px ${space.sm}px`,
                        borderRadius: radius.pill,
                        border: `1px solid ${color.border}`,
                        background: color.surface,
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                      }}
                    >
                      {group.name}
                    </Link>
                  ))}
                </div>
              </Row>
            )}

            <Row icon={<MapPin size={ROW_ICON_SIZE} aria-hidden />}>
              {lesson.location ? (
                <>
                  <span style={{ fontWeight: 600 }}>{lesson.location.title}</span>
                  <a
                    href={lesson.location.uri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...small, display: 'inline-flex', alignItems: 'center', gap: space.xxs }}
                  >
                    {t('lesson.building')}
                    <ArrowUpRight size={LINK_ICON_SIZE} aria-hidden />
                  </a>
                </>
              ) : (
                <span style={faint}>{t('lesson.noRoom')}</span>
              )}
            </Row>

            <Row icon={<CalendarDays size={ROW_ICON_SIZE} aria-hidden />}>
              {sortedDates.length > 0 ? (
                <>
                  <span style={{ fontWeight: 600 }}>{t('lesson.dates')}</span>
                  <span style={small}>{t('lesson.held', { done, total: sortedDates.length })}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xxs, marginTop: space.xxs }}>
                    {sortedDates.map((item) => {
                      const past = item < clock.date
                      const selected = item === date
                      return (
                        <span
                          key={item}
                          style={{
                            padding: `2px ${space.xs}px`,
                            borderRadius: radius.pill,
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            border: `1px solid ${selected ? tone : color.border}`,
                            background: selected ? tint(tone, DATE_CHIP_TINT) : 'transparent',
                            color: past ? color.textFaint : color.text,
                            textDecoration: past ? 'line-through' : 'none',
                          }}
                        >
                          {dayMonth(item)}
                        </span>
                      )
                    })}
                  </div>
                </>
              ) : (
                <span>{t('lesson.fortnightly', { n: lesson.week })}</span>
              )}
            </Row>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: space.xxs,
                paddingTop: space.sm,
                borderTop: `1px solid ${color.border}`,
              }}
            >
              <Button
                variant="ghost"
                data-testid="hide-subject"
                icon={<EyeOff size={ROW_ICON_SIZE} aria-hidden />}
                onClick={() => onHideSubject(lesson.name)}
                style={{ paddingLeft: space.xs, marginLeft: -space.xs }}
              >
                {t('lesson.hide')}
              </Button>
              <span style={{ fontSize: fontSize.xs, color: color.textFaint }}>{t('lesson.hideHint')}</span>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
