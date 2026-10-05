import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Search } from 'lucide-react'
import { useEffect } from 'react'
import { SavedCard } from '../components/home/SavedCard'
import { Kbd } from '../components/ui/Kbd'
import { useHover } from '../hooks/useHover'
import { useIsCompact } from '../hooks/useMediaQuery'
import { useT } from '../i18n/useT'
import { isSaved, lastViewedStore, savedStore, useStore } from '../lib/storage'
import { searchOpenStore } from '../lib/ui-state'
import { color, duration, EASE_OUT, font, fontSize, glass, radius, space } from '../theme'

const STAGGER_S = 0.08
const RISE_PX = 18
const HERO_MAX_WIDTH = 620
const SUBTITLE_MAX_WIDTH = 520
const SEARCH_MAX_WIDTH = 560
const SEARCH_HEIGHT = 64
const SEARCH_ICON_SIZE = 22
const SEARCH_HINT = 'Ctrl K'
const TITLE_SIZE = 'clamp(44px, 9vw, 112px)'

function SearchTrigger() {
  const { t } = useT()
  const compact = useIsCompact()
  const { hovered, hoverProps } = useHover()
  return (
    <button
      type="button"
      data-testid="home-search"
      onClick={() => searchOpenStore.set(true)}
      {...hoverProps}
      style={{
        ...glass,
        display: 'flex',
        alignItems: 'center',
        gap: space.sm,
        width: '100%',
        maxWidth: SEARCH_MAX_WIDTH,
        height: SEARCH_HEIGHT,
        padding: `0 ${space.lg}px`,
        borderRadius: radius.pill,
        background: hovered ? color.surfaceHover : color.surface,
        borderColor: hovered ? color.borderStrong : color.border,
        color: color.textMuted,
        fontSize: fontSize.lg,
        textAlign: 'left',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Search size={SEARCH_ICON_SIZE} aria-hidden />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t('search.placeholder')}
      </span>
      {!compact && <Kbd>{SEARCH_HINT}</Kbd>}
    </button>
  )
}

const CARDS_STYLE = { display: 'flex', flexWrap: 'wrap', gap: space.sm } as const
const HEADING_STYLE = {
  marginBottom: space.sm,
  fontSize: fontSize.sm,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: color.textMuted,
} as const

// The search landing: title, a button that opens the palette, and the user's saved schedules.
export function HomePage() {
  const { t } = useT()
  const saved = useStore(savedStore)
  const lastViewed = useStore(lastViewedStore)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    document.title = t('app.name')
  }, [t])

  const item: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : RISE_PX },
    show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: EASE_OUT } },
  }
  const extra = lastViewed && !isSaved(saved, lastViewed) ? lastViewed : null

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: reducedMotion ? 0 : STAGGER_S } } }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: space.xl,
        maxWidth: HERO_MAX_WIDTH,
        padding: `${space.xl}px 0`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <motion.h1
          variants={item}
          style={{
            fontFamily: font.display,
            fontSize: TITLE_SIZE,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
          }}
        >
          {t('home.title')}
        </motion.h1>
        <motion.p
          variants={item}
          style={{ maxWidth: SUBTITLE_MAX_WIDTH, fontSize: fontSize.lg, color: color.textMuted }}
        >
          {t('home.subtitle')}
        </motion.p>
      </div>
      <motion.div variants={item}>
        <SearchTrigger />
      </motion.div>
      <section>
        <motion.h2 variants={item} style={HEADING_STYLE}>
          {t('home.saved')}
        </motion.h2>
        {saved.length > 0 ? (
          <div style={CARDS_STYLE}>
            {saved.map((entry) => (
              <SavedCard key={`${entry.kind}:${entry.id}`} item={entry} variants={item} />
            ))}
          </div>
        ) : (
          <motion.p variants={item} style={{ maxWidth: SUBTITLE_MAX_WIDTH, fontSize: fontSize.sm, color: color.textFaint }}>
            {t('home.savedEmpty')}
          </motion.p>
        )}
      </section>
      {extra && (
        <section>
          <motion.h2 variants={item} style={HEADING_STYLE}>
            {t('home.lastViewed')}
          </motion.h2>
          <div style={CARDS_STYLE}>
            <SavedCard item={extra} variants={item} />
          </div>
        </section>
      )}
    </motion.div>
  )
}
