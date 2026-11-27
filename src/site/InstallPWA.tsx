import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const estInstallee = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * Bandeau d'invitation à installer l'application.
 * Il reste affiché tant que l'utilisateur ne l'a pas fermé ou n'a pas installé l'app.
 * La fermeture ne vaut que pour la visite en cours : il réapparaît à la visite suivante.
 */
export function InstallPWA() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [aideIOS, setAideIOS] = useState(false)

  useEffect(() => {
    if (estInstallee()) return
    let ferme = false
    try { ferme = sessionStorage.getItem('pwa-ferme') === '1' } catch { /* indisponible */ }
    if (ferme) return
    setVisible(true)
    const onBIP = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent) }
    const onInstalled = () => setVisible(false)
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBIP); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (!visible) return null

  const fermer = () => {
    setVisible(false)
    try { sessionStorage.setItem('pwa-ferme', '1') } catch { /* indisponible */ }
  }

  const installer = async () => {
    if (evt) {
      await evt.prompt()
      const { outcome } = await evt.userChoice
      if (outcome === 'accepted') setVisible(false)
      setEvt(null)
    } else {
      setAideIOS(true)
    }
  }

  const ios = estIOS()

  return (
    <div role="dialog" aria-label="Installer l'application" className="fixed inset-x-3 bottom-[5.5rem] z-[45] mx-auto max-w-md md:bottom-6 md:right-6 md:left-auto md:mx-0">
      <div className="relative overflow-hidden rounded-2xl bg-creme p-4 pr-11 text-cafe shadow-2xl shadow-black/40 ring-1 ring-cafe/10">
        <button onClick={fermer} aria-label="Fermer" className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full text-xl text-cafe/50 hover:bg-cafe/5 hover:text-cafe">×</button>
        <div className="flex items-center gap-3.5">
          <img src="/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">Installez notre application</p>
            <p className="mt-0.5 text-sm leading-snug text-gris">Le menu du jour et la réservation, à un clic depuis votre écran d'accueil.</p>
          </div>
        </div>

        {aideIOS || (ios && !evt) ? (
          <ol className="mt-3 space-y-1.5 rounded-xl bg-white/70 p-3 text-sm">
            {ios ? (
              <>
                <li>1. Touchez le bouton <b>Partager</b> <span aria-hidden="true">⬆️</span> en bas de Safari.</li>
                <li>2. Choisissez <b>« Sur l'écran d'accueil »</b>.</li>
                <li>3. Touchez <b>Ajouter</b>.</li>
              </>
            ) : (
              <>
                <li>1. Ouvrez le menu <b>⋮</b> de votre navigateur.</li>
                <li>2. Choisissez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</li>
              </>
            )}
          </ol>
        ) : (
          <button onClick={installer} className="mt-3 w-full rounded-full bg-cafe py-3 text-sm font-semibold text-creme transition hover:bg-terre">
            Installer l'application
          </button>
        )}
      </div>
    </div>
  )
}
