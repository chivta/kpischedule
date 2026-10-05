import { motion, type Variants } from 'motion/react'
import { User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useHover } from '../../hooks/useHover'
import { useT } from '../../i18n/useT'
import { schedulePath } from '../../lib/routes'
import type { ScheduleRef } from '../../lib/storage'
import { clampLines, color, font, fontSize, glass, radius, space } from '../../theme'
import { Tilt } from '../ui/Tilt'

const ICON_SIZE = 20
const CARD_WIDTH = 220
const NAME_LINES = 2

// A saved or last-viewed schedule as a tilting glass card linking to its page.
export function SavedCard({ item, variants }: { item: ScheduleRef; variants: Variants }) {
  const { t } = useT()
  const { hovered, hoverProps } = useHover()
  const Icon = item.kind === 'group' ? Users : User
  return (
    <Tilt
      variants={variants}
      data-testid="saved-card"
      style={{
        ...glass,
        width: CARD_WIDTH,
        maxWidth: '100%',
        borderRadius: radius.md,
        background: hovered ? color.surfaceHover : color.surface,
        transition: 'background-color 0.2s ease',
      }}
      {...hoverProps}
    >
      <Link
        to={schedulePath(item)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: space.xs,
          height: '100%',
          padding: space.md,
        }}
      >
        <motion.span style={{ display: 'flex', color: color.textMuted }}>
          <Icon size={ICON_SIZE} aria-hidden />
        </motion.span>
        <span style={{ fontFamily: font.display, fontSize: fontSize.lg, fontWeight: 600, ...clampLines(NAME_LINES) }}>
          {item.name}
        </span>
        <span style={{ fontSize: fontSize.sm, color: color.textMuted }}>
          {item.detail || t('owner.lecturer')}
        </span>
      </Link>
    </Tilt>
  )
}
