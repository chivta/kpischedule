import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { HOME_PATH } from '../lib/routes'
import { color, font, fontSize, space } from '../theme'

const MARK_SIZE = 30

// The ring mark, a day dial with one arc lit, next to the site name.
export function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useT()
  return (
    <Link
      to={HOME_PATH}
      aria-label={t('app.home')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: space.xs, flexShrink: 0 }}
    >
      <svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="logo-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--lec)" />
            <stop offset="0.55" stopColor="var(--live)" />
            <stop offset="1" stopColor="var(--prac)" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="url(#logo-ring)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="100 38"
          transform="rotate(-90 32 32)"
        />
        <circle cx="32" cy="32" r="5" fill={color.text} />
      </svg>
      {!compact && (
        <span style={{ fontFamily: font.display, fontSize: fontSize.md, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {t('app.name')}
        </span>
      )}
    </Link>
  )
}
