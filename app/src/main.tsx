import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, getThemePreference } from './lib/preferences'
import { setupAppAutoUpdate } from './lib/app-update'
import { installScrollLock } from './lib/scroll-lock'

applyTheme(getThemePreference())
setupAppAutoUpdate()
installScrollLock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
