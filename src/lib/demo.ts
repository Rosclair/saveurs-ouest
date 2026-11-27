import { RESTAURANT_SLUG } from './supabase'
import type { Plat, Reservation, Restaurant } from './types'
import { ajouterJours, maintenantDouala } from './utils'

/**
 * Mode démonstration (uniquement pour le restaurant de démo).
 * Les identifiants de démo ouvrent un espace gérant « bac à sable » : toutes les
 * modifications restent dans le téléphone du visiteur (localStorage), sans toucher
 * la base de données ni le vrai compte gérant. Le site public du même téléphone
 * affiche ces modifications, pour que le visiteur voie l'effet de ses changements.
 */
export const DEMO_ACTIVE = RESTAURANT_SLUG === 'saveurs-ouest'
export const DEMO_EMAIL = 'gerant@saveurs-ouest.cm'
export const DEMO_MOT_DE_PASSE = 'Saveurs2026'

const CLE_ETAT = 'resto-demo-etat-v1'
const CLE_SESSION = 'resto-demo-session-v1'
const CLE_MES_RESA = 'resto-demo-mes-reservations-v1'
const DUREE = 24 * 3600 * 1000

export type EtatDemo = { plats: Plat[]; statuts: Record<string, Reservation['statut']>; maj: number }

function lire<T>(cle: string): T | null {
  try { return JSON.parse(localStorage.getItem(cle) || 'null') as T | null } catch { return null }
}
function ecrire(cle: string, v: unknown) {
  try { localStorage.setItem(cle, JSON.stringify(v)) } catch { /* stockage plein ou indisponible */ }
}

export const estIdentifiantDemo = (email: string, mdp: string) =>
  DEMO_ACTIVE && email.trim().toLowerCase() === DEMO_EMAIL && mdp === DEMO_MOT_DE_PASSE

export const sessionDemo = {
  ouverte: () => DEMO_ACTIVE && lire<boolean>(CLE_SESSION) === true,
  ouvrir: () => ecrire(CLE_SESSION, true),
  fermer: () => { try { localStorage.removeItem(CLE_SESSION) } catch { /* rien */ } },
}

/** État de démo en cours (null s'il n'existe pas ou a plus de 24 h) */
export function lireEtatDemo(): EtatDemo | null {
  if (!DEMO_ACTIVE) return null
  const e = lire<EtatDemo>(CLE_ETAT)
  if (!e || !Array.isArray(e.plats) || Date.now() - e.maj > DUREE) return null
  return e
}
export function ecrireEtatDemo(e: EtatDemo) { ecrire(CLE_ETAT, { ...e, maj: Date.now() }) }
export function effacerEtatDemo() { try { localStorage.removeItem(CLE_ETAT) } catch { /* rien */ } }

/** Réservations faites depuis ce téléphone (visibles dans l'espace gérant de démo) */
export function mesReservations(): Reservation[] {
  const l = lire<Reservation[]>(CLE_MES_RESA)
  return Array.isArray(l) ? l : []
}
export function enregistrerMaReservation(r: Reservation) {
  if (!DEMO_ACTIVE) return
  ecrire(CLE_MES_RESA, [r, ...mesReservations()].slice(0, 30))
}

/** Deux réservations fictives pour que la liste de démo ne soit pas vide */
export function reservationsExemple(resto: Restaurant, plats: Plat[]): Reservation[] {
  const auj = maintenantDouala().iso
  const p = (nom: string) => plats.find(x => x.nom.toLowerCase().startsWith(nom))
  const ndole = p('ndolé'), jus = p('jus de foléré') ?? p('jus'), poulet = p('poulet dg')
  const ligne = (pl: Plat | undefined, q: number) => pl ? [{ plat_id: pl.id, nom: pl.nom, prix: pl.prix, quantite: q }] : []
  const l1 = [...ligne(ndole, 2), ...ligne(jus, 2)]
  const l2 = [...ligne(poulet, 3)]
  const total = (l: { prix: number; quantite: number }[]) => l.reduce((s, x) => s + x.prix * x.quantite, 0)
  const base = { restaurant_id: resto.id, telephone: '', note: null, created_at: new Date().toISOString() }
  return [
    { ...base, id: 'exemple-1', reference: 'R-0001', nom: 'Mireille K.', date: auj, heure: '19:30', personnes: 4, plats: l1, total: total(l1), statut: 'payee' },
    { ...base, id: 'exemple-2', reference: 'R-0002', nom: 'Paul T.', date: auj, heure: '20:00', personnes: 6, plats: l2, total: total(l2), statut: 'confirmee' },
    { ...base, id: 'exemple-3', reference: 'R-0003', nom: 'Aïcha N.', date: ajouterJours(auj, 1), heure: '13:00', personnes: 2, plats: [], total: 0, statut: 'demandee' },
  ]
}
