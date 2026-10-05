import { useMemo } from 'react'
import { localeStore, useStore, type Locale } from '../lib/storage'
import { MINUTES_PER_HOUR, toUtcDate, type IsoDate } from '../lib/time'
import { translations, type TranslationKey } from './translations'

type Params = Record<string, string | number>

// Keys that have _one/_few/_many/_other variants, without the suffix.
type PluralKey = TranslationKey extends infer Key
  ? Key extends `${infer Base}_one`
    ? Base
    : never
  : never

const INTL_LOCALE: Record<Locale, string> = { uk: 'uk-UA', en: 'en-GB' }

function fill(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export interface Translator {
  locale: Locale
  t: (key: TranslationKey, params?: Params) => string
  // Picks the plural form for `count` and passes it as {n}.
  tn: (key: PluralKey, count: number) => string
  // "пн" or "понеділок"
  weekday: (date: IsoDate, width: 'short' | 'long') => string
  // "5 жовтня"
  dayMonth: (date: IsoDate) => string
  // "5 – 10 жовтня" for the study week starting on `monday`
  weekRange: (monday: IsoDate, saturday: IsoDate) => string
  // "1 год 20 хв"
  duration: (minutes: number) => string
}

function createTranslator(locale: Locale): Translator {
  const map = translations[locale]
  const intlLocale = INTL_LOCALE[locale]
  const pluralRules = new Intl.PluralRules(intlLocale)
  const dayMonthFormat = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  const weekdayFormat = {
    short: new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' }),
    long: new Intl.DateTimeFormat(intlLocale, { weekday: 'long', timeZone: 'UTC' }),
  }

  const t = (key: TranslationKey, params?: Params) => fill(map[key], params)

  return {
    locale,
    t,
    tn: (key, count) => t(`${key}_${pluralRules.select(count)}` as TranslationKey, { n: count }),
    weekday: (date, width) => weekdayFormat[width].format(toUtcDate(date)),
    dayMonth: (date) => dayMonthFormat.format(toUtcDate(date)),
    weekRange: (monday, saturday) => dayMonthFormat.formatRange(toUtcDate(monday), toUtcDate(saturday)),
    duration: (minutes) => {
      const h = Math.floor(minutes / MINUTES_PER_HOUR)
      const m = minutes % MINUTES_PER_HOUR
      if (h === 0) return t('duration.minutes', { m })
      if (m === 0) return t('duration.hours', { h })
      return t('duration.hoursMinutes', { h, m })
    },
  }
}

// Translation and locale-aware formatting for the current language.
export function useT(): Translator {
  const locale = useStore(localeStore)
  return useMemo(() => createTranslator(locale), [locale])
}
