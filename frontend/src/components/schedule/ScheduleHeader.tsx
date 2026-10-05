import { ArrowUpRight, Check, Share2, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ApiLecturerProfile, OwnerKind } from '../../api/types'
import { useT } from '../../i18n/useT'
import { isSaved, savedStore, toggleSaved, useStore, type ScheduleRef } from '../../lib/storage'
import { color, font, fontSize, space } from '../../theme'
import { IconButton } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'

const COPIED_MS = 2000
const PHOTO_SIZE = 64
const ICON_SIZE = 18
const LINK_ICON_SIZE = 14
const NAME_SKELETON_WIDTH = 320
const NAME_SKELETON_HEIGHT = 48
const LABEL_SEPARATOR = ' · '
const BLOCK_BASIS = 360

interface ScheduleHeaderProps {
  kind: OwnerKind
  // Null while the name is loading.
  owner: ScheduleRef | null
  profile: ApiLecturerProfile | null
}

// Copies through a hidden textarea when the async clipboard API is denied, as in some in-app
// browsers or when the page has lost focus. Returns false when that fails too.
function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const copied = document.execCommand('copy')
  area.remove()
  return copied
}

// Owner name, kind label, lecturer photo and the save and share buttons.
export function ScheduleHeader({ kind, owner, profile }: ScheduleHeaderProps) {
  const { t } = useT()
  const saved = useStore(savedStore)
  const [copied, setCopied] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const timer = useRef<number>(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const starred = owner !== null && isSaved(saved, owner)
  const saveLabel = starred ? t('schedule.unsave') : t('schedule.save')

  const copy = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      if (!copyWithSelection(url)) return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }

  const label =
    kind === 'group'
      ? [t('owner.group'), owner?.detail].filter(Boolean).join(LABEL_SEPARATOR)
      : t('owner.lecturer')

  return (
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.md, flex: `1 1 ${BLOCK_BASIS}px`, minWidth: 0 }}>
        {kind === 'lecturer' && profile && !photoFailed && (
          <img
            src={profile.photo}
            alt=""
            onError={() => setPhotoFailed(true)}
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: fontSize.xs,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: color.textMuted,
              marginBottom: space.xs,
            }}
          >
            {label}
          </div>
          {owner ? (
            <h1
              data-testid="owner-name"
              style={{
                fontFamily: font.display,
                fontSize: 'clamp(34px, 6vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                overflowWrap: 'anywhere',
              }}
            >
              {owner.name}
            </h1>
          ) : (
            <Skeleton width={NAME_SKELETON_WIDTH} height={NAME_SKELETON_HEIGHT} />
          )}
          {kind === 'lecturer' && profile && (
            <a
              href={profile.profile}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: space.xxs,
                marginTop: space.xs,
                fontSize: fontSize.sm,
                fontWeight: 600,
                color: color.textMuted,
              }}
            >
              {t('schedule.lecturerProfile')}
              <ArrowUpRight size={LINK_ICON_SIZE} aria-hidden />
            </a>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: space.xs }}>
        <IconButton
          label={saveLabel}
          active={starred}
          aria-pressed={starred}
          data-testid="save-toggle"
          disabled={!owner}
          onClick={() => owner && toggleSaved(owner)}
        >
          <Star size={ICON_SIZE} fill={starred ? 'currentColor' : 'none'} />
        </IconButton>
        <IconButton
          label={copied ? t('schedule.copied') : t('schedule.share')}
          data-testid="share-button"
          onClick={copy}
        >
          {copied ? <Check size={ICON_SIZE} /> : <Share2 size={ICON_SIZE} />}
        </IconButton>
      </div>
    </header>
  )
}
