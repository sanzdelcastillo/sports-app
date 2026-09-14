import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppStateProvider } from './stores/AppState'
import { hydrate, migrateProvider } from './lib/storage'
import { initNative } from './native/init'
import { isNative } from './native/platform'
import './styles/global.css'

void hydrate().then(() => {
  migrateProvider()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </StrictMode>,
  )
  void initNative()
})

// Offline shell + home-screen install. Production only so dev reloads stay predictable.
if (import.meta.env.PROD && !isNative() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* install is optional — the app works without it */
    })
  })
}
