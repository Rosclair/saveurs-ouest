import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Site from './site/Site'
import type { BIPEvent } from './site/InstallPWA'

// Capturé au plus tôt : Chrome n'envoie cette invitation qu'une fois par chargement.
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  window.__installPrompt = e as BIPEvent
  window.dispatchEvent(new Event('install-pret'))
})

const Admin = lazy(() => import('./admin/Admin'))
const estAdmin = window.location.pathname.startsWith('/admin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {estAdmin ? <Suspense fallback={<div className="min-h-screen bg-cafe" />}><Admin /></Suspense> : <Site />}
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}
