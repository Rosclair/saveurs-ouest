import { useEffect, useState } from 'react'

export type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
declare global { interface Window { __installPrompt?: BIPEvent | null } }

const estInstallee = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/**
 * Bandeau d'installation : il ne s'affiche que lorsque le navigateur autorise
 * l'installation directe (Chrome, Edge, Samsung Internet sur Android).
 * Le bouton ouvre alors la fenêtre d'installation du téléphone, sans instructions.
 * Il reste affiché tant que l'utilisateur ne l'a pas fermé ou n'a pas installé l'app.
 */
export function InstallPWA() {
  const [evt, setEvt] = useState<BIPEvent | null>(() => window.__installPrompt ?? null)
  const [ferme, setFerme] = useState(() => { try { return sessionStorage.getItem('pwa-ferme') === '1' } catch { return false } })

  useEffect(() => {
    const onPret = () => setEvt(window.__installPrompt ?? null)
    const onInstalled = () => setEvt(null)
    window.addEventListener('install-pret', onPret)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('install-pret', onPret); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (!evt || ferme || estInstallee()) return null

  const fermer = () => {
    setFerme(true)
    try { sessionStorage.setItem('pwa-ferme', '1') } catch { /* indisponible */ }
  }

  const installer = async () => {
    await evt.prompt()
    await evt.userChoice
    window.__installPrompt = null
    setEvt(null) // l'invitation ne peut servir qu'une fois ; Chrome en renverra une si besoin
  }

  return (
    <div role="dialog" aria-label="Installer l'application" className="fixed inset-x-3 bottom-[5.5rem] z-[45] mx-auto max-w-md md:bottom-6 md:right-6 md:left-auto md:mx-0">
      <div className="relative rounded-2xl bg-creme p-4 pr-11 text-cafe shadow-2xl shadow-black/40 ring-1 ring-cafe/10">
        <button onClick={fermer} aria-label="Fermer" className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full text-xl text-cafe/50 hover:bg-cafe/5 hover:text-cafe">×</button>
        <div className="flex items-center gap-3.5">
          <img src="/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">Installez notre application</p>
            <p className="mt-0.5 text-sm leading-snug text-gris">Le menu du jour et la réservation, à un clic depuis votre écran d'accueil.</p>
          </div>
        </div>
        <button onClick={installer} className="mt-3 w-full rounded-full bg-cafe py-3 text-sm font-semibold text-creme transition hover:bg-terre">
          Installer l'application
        </button>
      </div>
    </div>
  )
}
