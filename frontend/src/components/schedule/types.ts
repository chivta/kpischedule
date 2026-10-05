// Props shared between the schedule page and the panels it hosts.

import type { Lesson, OwnerKind } from '../../api/types'
import type { IsoDate, Slot, WeekAnchor } from '../../lib/time'

// A lesson picked on a specific calendar date, e.g. by clicking its card.
export interface LessonSelection {
  lesson: Lesson
  date: IsoDate
}

export interface NowPanelProps {
  lessons: Lesson[]
  slots: Slot[]
  anchor: WeekAnchor
  // Whose schedule this is. A group's lessons show the lecturer, a lecturer's show the groups.
  kind: OwnerKind
  onSelect: (selection: LessonSelection) => void
}

export interface LessonDialogProps {
  // Null keeps the dialog closed.
  selection: LessonSelection | null
  slots: Slot[]
  kind: OwnerKind
  onClose: () => void
  // Removes every lesson of the subject from this schedule. The page closes the dialog.
  onHideSubject: (subject: string) => void
}

export interface ExamsListProps {
  groupId: string
}
