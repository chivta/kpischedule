import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { User, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OwnerKind } from '../api/types'
import { useGroups, useLecturers } from '../hooks/useDirectory'
import { useIsCompact } from '../hooks/useMediaQuery'
import { useT } from '../i18n/useT'
import { schedulePath } from '../lib/routes'
import { searchDirectory } from '../lib/search'
import { savedStore, useStore } from '../lib/storage'
import { searchOpenStore } from '../lib/ui-state'
import { color, font, fontSize, glass, radius, space, zIndex } from '../theme'
import { Kbd } from './ui/Kbd'

const RESULTS_PER_SECTION = 8
const PALETTE_MAX_WIDTH = 620
const PALETTE_TOP = '14vh'
const LIST_MAX_HEIGHT = '50vh'
const ICON_SIZE = 18
const OVERLAY_BLUR_PX = 6
const ENTER_ANIMATION = 'sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
const SEARCH_HOTKEY = 'k'
const SLASH_HOTKEY = '/'
const KEY_ARROWS = '↑↓'
const KEY_ENTER = 'Enter'
const KEY_ESC = 'Esc'
const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA'])
const HEADING_STYLE: CSSProperties = {
  padding: `${space.sm}px ${space.sm}px ${space.xxs}px`,
  fontSize: fontSize.xs,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: color.textFaint,
}
const NOTE_STYLE: CSSProperties = {
  padding: `${space.md}px ${space.sm}px`,
  fontSize: fontSize.sm,
  color: color.textMuted,
}

interface Entry {
  kind: OwnerKind
  id: string
  name: string
  // Faculty for a group, empty for a lecturer.
  detail: string
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (TEXT_ENTRY_TAGS.has(target.tagName) || target.isContentEditable)
}

// One result row. Selection highlight comes from cmdk through global.css.
function Row({ entry, onPick }: { entry: Entry; onPick: (entry: Entry) => void }) {
  const Icon = entry.kind === 'group' ? Users : User
  return (
    <Command.Item
      value={`${entry.kind}:${entry.id}`}
      onSelect={() => onPick(entry)}
      data-testid="search-item"
      data-kind={entry.kind}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space.sm,
        padding: `${space.sm}px`,
        borderRadius: radius.sm,
        cursor: 'pointer',
        fontSize: fontSize.md,
      }}
    >
      <Icon size={ICON_SIZE} aria-hidden style={{ flexShrink: 0, color: color.textMuted }} />
      <span style={{ fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {entry.name}
      </span>
      {entry.detail && (
        <span
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            fontSize: fontSize.sm,
            color: color.textMuted,
          }}
        >
          {entry.detail}
        </span>
      )}
    </Command.Item>
  )
}

function Section({ heading, entries, onPick }: { heading: string; entries: Entry[]; onPick: (e: Entry) => void }) {
  if (entries.length === 0) return null
  return (
    <Command.Group aria-label={heading} style={{ marginBottom: space.xxs }}>
      <div aria-hidden style={HEADING_STYLE}>
        {heading}
      </div>
      {entries.map((entry) => (
        <Row key={`${entry.kind}:${entry.id}`} entry={entry} onPick={onPick} />
      ))}
    </Command.Group>
  )
}

// The global search palette: mounted once in App, opened through searchOpenStore.
export function SearchPalette() {
  const { t } = useT()
  const navigate = useNavigate()
  const compact = useIsCompact()
  const open = useStore(searchOpenStore)
  const saved = useStore(savedStore)
  const [query, setQuery] = useState('')
  const [everOpened, setEverOpened] = useState(false)
  if (open && !everOpened) setEverOpened(true)

  const groups = useGroups(everOpened)
  const lecturers = useLecturers(everOpened)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === SEARCH_HOTKEY) {
        event.preventDefault()
        searchOpenStore.set(!searchOpenStore.get())
      } else if (event.key === SLASH_HOTKEY && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (searchOpenStore.get() || isTextEntry(event.target)) return
        event.preventDefault()
        searchOpenStore.set(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const results = useMemo(
    () => searchDirectory(query, groups.data ?? [], lecturers.data ?? [], RESULTS_PER_SECTION),
    [query, groups.data, lecturers.data],
  )

  const setOpen = (next: boolean) => {
    searchOpenStore.set(next)
    if (!next) setQuery('')
  }

  const pick = (entry: Entry) => {
    navigate(schedulePath(entry))
    setOpen(false)
  }

  const groupEntries: Entry[] = results.groups.map((g) => ({
    kind: 'group',
    id: String(g.id),
    name: g.name,
    detail: g.faculty,
  }))
  const lecturerEntries: Entry[] = results.lecturers.map((l) => ({
    kind: 'lecturer',
    id: l.id,
    name: l.name,
    detail: '',
  }))

  const hasQuery = query.trim() !== ''
  const stillLoading =
    (groups.data === undefined && groups.loading) || (lecturers.data === undefined && lecturers.loading)
  const nothingFound = hasQuery && groupEntries.length === 0 && lecturerEntries.length === 0

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex.overlay,
            background: color.overlay,
            backdropFilter: `blur(${OVERLAY_BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${OVERLAY_BLUR_PX}px)`,
            animation: 'fade-in 0.2s ease-out',
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // cmdk's input is the autofocus target, not the first tabbable thing Radix finds.
            event.preventDefault()
            document.querySelector<HTMLElement>('[data-testid="search-input"]')?.focus()
          }}
          style={{
            position: 'fixed',
            zIndex: zIndex.dialog,
            top: compact ? space.sm : PALETTE_TOP,
            left: space.sm,
            right: space.sm,
            width: 'auto',
            maxWidth: PALETTE_MAX_WIDTH,
            margin: '0 auto',
            overflow: 'hidden',
            ...glass,
            background: `color-mix(in srgb, ${color.bgRaised} 88%, transparent)`,
            borderRadius: radius.lg,
            animation: ENTER_ANIMATION,
          }}
        >
          <Dialog.Title style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {t('search.open')}
          </Dialog.Title>
          <Command shouldFilter={false} label={t('search.open')} loop>
            <Command.Input
              data-testid="search-input"
              value={query}
              onValueChange={setQuery}
              placeholder={t('search.placeholder')}
              autoComplete="off"
              spellCheck={false}
              style={{
                width: '100%',
                height: 60,
                padding: `0 ${space.lg}px`,
                border: 'none',
                borderBottom: `1px solid ${color.border}`,
                background: 'transparent',
                fontFamily: font.body,
                fontSize: fontSize.lg,
                color: color.text,
                outline: 'none',
              }}
            />
            <Command.List
              className="scroll-thin"
              style={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto', padding: space.xs }}
            >
              {!hasQuery && (
                <>
                  <Section
                    heading={t('search.saved')}
                    entries={saved.map(({ kind, id, name, detail }) => ({ kind, id, name, detail }))}
                    onPick={pick}
                  />
                  <p style={NOTE_STYLE}>{t('search.hint')}</p>
                </>
              )}
              {hasQuery && (
                <>
                  <Section heading={t('search.groups')} entries={groupEntries} onPick={pick} />
                  <Section heading={t('search.lecturers')} entries={lecturerEntries} onPick={pick} />
                  {stillLoading && <p style={NOTE_STYLE}>{t('search.loading')}</p>}
                  {nothingFound && !stillLoading && <p style={NOTE_STYLE}>{t('search.empty')}</p>}
                </>
              )}
            </Command.List>
          </Command>
          {!compact && (
            <div
              style={{
                display: 'flex',
                gap: space.lg,
                padding: `${space.xs}px ${space.md}px`,
                borderTop: `1px solid ${color.border}`,
                fontSize: fontSize.xs,
                color: color.textMuted,
              }}
            >
              {(
                [
                  [KEY_ARROWS, 'search.navigate'],
                  [KEY_ENTER, 'search.select'],
                  [KEY_ESC, 'search.close'],
                ] as const
              ).map(([key, label]) => (
                <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: space.xs }}>
                  <Kbd>{key}</Kbd>
                  {t(label)}
                </span>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
