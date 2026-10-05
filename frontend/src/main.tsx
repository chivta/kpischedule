import '@fontsource-variable/unbounded/index.css'
import '@fontsource-variable/onest/index.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { HOME_PATH, bootTarget, schedulePath } from './lib/routes'

// A returning visitor opening the site root goes straight to their schedule. Rewriting the
// URL before the router mounts avoids a flash of the search page.
const target = bootTarget()
if (target && window.location.pathname === HOME_PATH) {
  window.history.replaceState(null, '', schedulePath(target))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
