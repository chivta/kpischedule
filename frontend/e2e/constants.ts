export const IDS = {
  group: '5814',
  emptyGroup: '5389',
  noExamGroup: '5815',
  lecturer: '622373b3957bb84f01ef43a931c9995fab3323bff4d223b3cfb324e5af11c97e',
} as const

export const NAMES = {
  group: 'ІІ-51',
  searchGroup: 'ІО-51',
  faculty: 'ФІОТ',
  lecturer: 'Завгородній Валерій Вікторович',
  running: 'Теорія ймовірностей',
  next: 'Алгоритми та структури ігрових рушіїв',
  dated: 'Бази даних',
  exam: 'ПК (зал) (залік)',
} as const

export const INSTANTS = {
  running: '2026-10-06T06:10:00Z',
  break: '2026-10-06T07:10:00Z',
  beforeFirst: '2026-10-06T04:00:00Z',
  done: '2026-10-06T12:00:00Z',
  sunday: '2026-10-11T09:00:00Z',
  fridayElectives: '2026-10-16T07:25:00Z',
} as const

export const PATHS = {
  home: '/',
  group: `/group/${IDS.group}`,
  emptyGroup: `/group/${IDS.emptyGroup}`,
  noExamGroup: `/group/${IDS.noExamGroup}`,
  lecturer: `/lecturer/${IDS.lecturer}`,
  missing: '/definitely-not-a-route',
} as const

export const API_HOSTS = ['api.campus.kpi.ua', 'cdn.cloud.kpi.ua'] as const
export const CACHE_MAX_AGE_MS = 10 * 60 * 1000
export const FEEDBACK_URL = 'https://t.me/ukbotsup'
