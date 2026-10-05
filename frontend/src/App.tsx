import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { SearchPalette } from './components/SearchPalette'
import { TopBar } from './components/TopBar'
import { useApplyTheme } from './hooks/useTheme'
import { GROUP_ROUTE, HOME_PATH, LECTURER_ROUTE } from './lib/routes'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SchedulePage } from './pages/SchedulePage'
import { PAGE_MAX_WIDTH, space, zIndex } from './theme'

// three.js is the heaviest part of the bundle, so the scene loads after the UI is usable.
const Background3D = lazy(() => import('./components/background/Background3D'))

export function App() {
  useApplyTheme()
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>
      <div
        style={{
          position: 'relative',
          zIndex: zIndex.content,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          maxWidth: PAGE_MAX_WIDTH,
          margin: '0 auto',
          padding: `0 ${space.md}px`,
        }}
      >
        <TopBar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path={HOME_PATH} element={<HomePage />} />
            <Route path={GROUP_ROUTE} element={<SchedulePage kind="group" />} />
            <Route path={LECTURER_ROUTE} element={<SchedulePage kind="lecturer" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <SearchPalette />
    </BrowserRouter>
  )
}
