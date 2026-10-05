import { useT } from '../i18n/useT'
import { REPO_URL } from '../lib/routes'
import { color, fontSize, space } from '../theme'

export function Footer() {
  const { t } = useT()
  return (
    <footer
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: space.sm,
        padding: `${space.xl}px 0 ${space.lg}px`,
        color: color.textFaint,
        fontSize: fontSize.sm,
      }}
    >
      <span>{t('footer.unofficial')}</span>
      <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: color.textMuted }}>
        {t('footer.source')}
      </a>
    </footer>
  )
}
