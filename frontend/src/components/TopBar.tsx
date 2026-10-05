import { Monitor, Moon, Search, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useIsCompact } from '../hooks/useMediaQuery'
import { useT } from '../i18n/useT'
import { HOME_PATH } from '../lib/routes'
import { localeStore, themeStore, useStore, type Locale, type ThemeChoice } from '../lib/storage'
import { searchOpenStore } from '../lib/ui-state'
import { color, fontSize, glass, radius, space, zIndex } from '../theme'
import { Logo } from './Logo'
import { IconButton } from './ui/Button'
import { Kbd } from './ui/Kbd'

const ICON_SIZE = 18
const SEARCH_MAX_WIDTH = 420
const BAR_HEIGHT = 46

const NEXT_THEME: Record<ThemeChoice, ThemeChoice> = { system: 'light', light: 'dark', dark: 'system' }
const NEXT_LOCALE: Record<Locale, Locale> = { uk: 'en', en: 'uk' }
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon }

// The floating bar: logo, the button that opens search, language and theme switches.
export function TopBar() {
  const { t, locale } = useT()
  const theme = useStore(themeStore)
  const compact = useIsCompact()
  const onHome = useLocation().pathname === HOME_PATH
  const ThemeIcon = THEME_ICON[theme]

  return (
    <header
      style={{
        position: 'sticky',
        top: space.sm,
        zIndex: zIndex.topBar,
        display: 'flex',
        alignItems: 'center',
        gap: space.sm,
        marginTop: space.sm,
        padding: space.xs,
        paddingLeft: space.md,
        borderRadius: radius.pill,
        ...glass,
      }}
    >
      <Logo compact={compact && !onHome} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
        {!onHome && (
          <button
            type="button"
            onClick={() => searchOpenStore.set(true)}
            aria-label={t('search.open')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: space.xs,
              width: '100%',
              maxWidth: SEARCH_MAX_WIDTH,
              height: BAR_HEIGHT - space.xxs,
              padding: `0 ${space.md}px`,
              borderRadius: radius.pill,
              border: `1px solid ${color.border}`,
              background: color.surface,
              color: color.textMuted,
              fontSize: fontSize.md,
              textAlign: 'left',
            }}
          >
            <Search size={ICON_SIZE} aria-hidden />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t('search.placeholder')}
            </span>
            {!compact && <Kbd>Ctrl K</Kbd>}
          </button>
        )}
      </div>
      <IconButton
        label={t('locale.toggle')}
        onClick={() => localeStore.set(NEXT_LOCALE[locale])}
        style={{ fontSize: fontSize.sm, fontWeight: 700 }}
      >
        {locale.toUpperCase()}
      </IconButton>
      <IconButton
        label={`${t('theme.toggle')}: ${t(`theme.${theme}`)}`}
        onClick={() => themeStore.set(NEXT_THEME[theme])}
      >
        <ThemeIcon size={ICON_SIZE} aria-hidden />
      </IconButton>
    </header>
  )
}
