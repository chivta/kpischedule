import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { HOME_PATH } from '../lib/routes'
import { color, font, fontSize, space } from '../theme'

export function NotFoundPage() {
  const { t } = useT()
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.md,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: font.display, fontSize: fontSize.xl }}>{t('notFound.title')}</h1>
      <Link to={HOME_PATH} style={{ color: color.textMuted, textDecoration: 'underline' }}>
        {t('notFound.back')}
      </Link>
    </div>
  )
}
