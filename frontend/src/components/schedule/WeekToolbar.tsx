import { ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { useEffect } from 'react'
import { useT } from '../../i18n/useT'
import { showAllStore, useStore } from '../../lib/storage'
import { addDays, type IsoDate } from '../../lib/time'
import { color, font, fontSize, space } from '../../theme'
import { Button, IconButton } from '../ui/Button'
import { Chip } from '../ui/Chip'

const SATURDAY_OFFSET = 5
const ICON_SIZE = 18
const PREV_KEY = 'ArrowLeft'
const NEXT_KEY = 'ArrowRight'
const TODAY_CODE = 'KeyT'
const TEXT_TARGETS = ['INPUT', 'TEXTAREA']
const DIALOG_SELECTOR = '[role="dialog"]'
const LABEL_SEPARATOR = ' · '

interface WeekToolbarProps {
  monday: IsoDate
  weekNumber: number
  weekOffset: number
  onShiftWeek: (delta: number) => void
  onToday: () => void
  hiddenCount: number
  onRestoreHidden: () => void
}

// Week navigation row with the show-all toggle and the restore-hidden button. Binds arrow keys and "t".
export function WeekToolbar({
  monday,
  weekNumber,
  weekOffset,
  onShiftWeek,
  onToday,
  hiddenCount,
  onRestoreHidden,
}: WeekToolbarProps) {
  const { t, tn, weekRange } = useT()
  const showAll = useStore(showAllStore)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && TEXT_TARGETS.includes(target.tagName)) return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (document.querySelector(DIALOG_SELECTOR)) return
      if (event.key === PREV_KEY) onShiftWeek(-1)
      else if (event.key === NEXT_KEY) onShiftWeek(1)
      else if (event.code === TODAY_CODE) onToday()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onShiftWeek, onToday])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.xs }}>
      <IconButton label={t('schedule.prevWeek')} data-testid="week-prev" onClick={() => onShiftWeek(-1)}>
        <ChevronLeft size={ICON_SIZE} />
      </IconButton>
      <div data-testid="week-label" style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
        <span style={{ fontWeight: 600, fontSize: fontSize.md, whiteSpace: 'nowrap' }}>
          {weekRange(monday, addDays(monday, SATURDAY_OFFSET))}
        </span>
        <Chip>{t('schedule.week', { n: weekNumber })}</Chip>
      </div>
      <IconButton label={t('schedule.nextWeek')} data-testid="week-next" onClick={() => onShiftWeek(1)}>
        <ChevronRight size={ICON_SIZE} />
      </IconButton>
      {weekOffset !== 0 && (
        <Button data-testid="week-today" onClick={onToday}>
          {t('schedule.today')}
        </Button>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs, marginLeft: 'auto' }}>
        <Button
          active={showAll}
          aria-pressed={showAll}
          title={t('schedule.showAllHint')}
          icon={<Layers size={ICON_SIZE} />}
          data-testid="show-all"
          onClick={() => showAllStore.set(!showAll)}
        >
          {t('schedule.showAll')}
        </Button>
        {hiddenCount > 0 && (
          <Button data-testid="restore-hidden" onClick={onRestoreHidden} style={{ fontFamily: font.body, color: color.textMuted }}>
            {tn('schedule.hidden', hiddenCount)}
            {LABEL_SEPARATOR}
            {t('schedule.restoreHidden')}
          </Button>
        )}
      </div>
    </div>
  )
}
