import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type Route } from '@playwright/test'
import { API_HOSTS, IDS, INSTANTS } from '../constants'

type LessonsMode = 'ok' | 'error' | 'abort'

interface MockApi {
  setLessonsMode: (mode: LessonsMode) => void
}

interface Fixtures {
  clockTime: string
  mockApi: MockApi
}

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), 'utf8')) as unknown

const groupSchedule = fixture('group-5814.json')
const lecturerSchedule = fixture('lecturer-zavhorodnii.json')
const groups = fixture('groups.json')
const lecturers = fixture('lecturers.json')
const slots = fixture('slots.json')
const exams = fixture('exams-5814.json')

const emptySchedule = {
  scheduleFirstWeek: ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => ({ day, pairs: [] })),
  scheduleSecondWeek: ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => ({ day, pairs: [] })),
}

// Computes the server week and weekday from the same frozen instant used by the page.
function currentTime(instant: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const date = formatter.format(new Date(instant))
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  const mondayDay = day === 0 ? 6 : day - 1
  const monday = new Date(`${date}T00:00:00Z`)
  monday.setUTCDate(monday.getUTCDate() - mondayDay)
  const anchor = Date.parse('2026-10-05T00:00:00Z')
  const weeks = Math.round((monday.getTime() - anchor) / (7 * 24 * 60 * 60 * 1000))
  return { currentWeek: Math.abs(weeks) % 2 === 0 ? 2 : 1, currentDay: day === 0 ? 7 : day, currentLesson: 0 }
}

export const test = base.extend<Fixtures>({
  clockTime: [INSTANTS.running, { option: true }],

  mockApi: [async ({ page, clockTime }, use) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const unexpectedRequests: string[] = []
    let lessonsMode: LessonsMode = 'ok'

    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.clock.install({ time: new Date(clockTime) })

    const respond = async (route: Route, data: unknown) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
    }

    await page.route(/^https:\/\/(?:api\.campus\.kpi\.ua|cdn\.cloud\.kpi\.ua)\//, async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname

      if (request.method() !== 'GET') {
        unexpectedRequests.push(`${request.method()} ${url.href}`)
        await route.abort('failed')
        return
      }
      if (url.hostname === 'cdn.cloud.kpi.ua' && path.startsWith('/profile-images/')) {
        await route.fulfill({ status: 204 })
        return
      }
      if (path === '/group/all') return respond(route, groups)
      if (path === '/schedule/lecturer/list') return respond(route, lecturers)
      if (path === '/schedule/lessons/slots') return respond(route, slots)
      if (path === '/time/current') return respond(route, currentTime(clockTime))
      if (path === '/schedule/lecturer' && url.searchParams.get('lecturerId') === IDS.lecturer) {
        return respond(route, lecturerSchedule)
      }
      if (path === '/schedule/exams/group') {
        return respond(route, url.searchParams.get('groupId') === IDS.group ? exams : [])
      }
      if (path === '/schedule/lessons') {
        if (lessonsMode === 'abort') {
          await route.abort('internetdisconnected')
          return
        }
        if (lessonsMode === 'error') {
          await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
          return
        }
        const id = url.searchParams.get('groupId')
        return respond(route, id === IDS.group || id === IDS.noExamGroup ? groupSchedule : emptySchedule)
      }

      unexpectedRequests.push(`${request.method()} ${url.href}`)
      await route.abort('failed')
    })

    await use({ setLessonsMode: (mode) => { lessonsMode = mode } })

    expect(unexpectedRequests, 'Every Campus API request must be explicitly mocked').toEqual([])
    expect(pageErrors, 'No visited page may emit page errors').toEqual([])
    expect(consoleErrors, 'No visited page may emit console errors').toEqual([])
  }, { auto: true }],
})

export { expect } from '@playwright/test'
