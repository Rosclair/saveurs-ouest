import type { Horaires } from './types'

export const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ') + ' FCFA'

const TZ = 'Africa/Douala'
export const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** Date et heure actuelles à Douala */
export function maintenantDouala() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
      .formatToParts(new Date()).map(p => [p.type, p.value])
  )
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  const hh = parts.hour === '24' ? '00' : parts.hour
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, jour: wd, minutes: Number(hh) * 60 + Number(parts.minute), heure: `${hh}:${parts.minute}` }
}

const toMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
export const hFr = (h: string) => h.replace(':00', 'h').replace(':', 'h')

export function statutOuverture(horaires: Horaires): { ouvert: boolean; texte: string } {
  const n = maintenantDouala()
  const auj = horaires[String(n.jour)]
  if (auj) {
    const [o, f] = auj
    if (n.minutes >= toMin(o) && n.minutes < toMin(f)) {
      const reste = toMin(f) - n.minutes
      return { ouvert: true, texte: reste <= 60 ? `Ouvert · ferme à ${hFr(f)}` : `Ouvert maintenant · jusqu'à ${hFr(f)}` }
    }
    if (n.minutes < toMin(o)) return { ouvert: false, texte: `Fermé · ouvre à ${hFr(o)}` }
  }
  for (let i = 1; i <= 7; i++) {
    const j = (n.jour + i) % 7
    const h = horaires[String(j)]
    if (h) return { ouvert: false, texte: `Fermé · ouvre ${i === 1 ? 'demain' : JOURS[j].toLowerCase()} à ${hFr(h[0])}` }
  }
  return { ouvert: false, texte: 'Fermé' }
}

export function dateLongue(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
  return s
}

export function ajouterJours(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

/** Créneaux de 30 min entre ouverture et fermeture - 1h, en excluant le passé si c'est aujourd'hui */
export function creneaux(horaires: Horaires, dateIso: string): string[] {
  const [y, m, d] = dateIso.split('-').map(Number)
  const jour = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const h = horaires[String(jour)]
  if (!h) return []
  const n = maintenantDouala()
  const res: string[] = []
  for (let t = toMin(h[0]); t <= toMin(h[1]) - 60; t += 30) {
    if (dateIso === n.iso && t < n.minutes + 30) continue
    res.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return res
}

export const lienWhatsApp = (numero: string, texte: string) => `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texte)}`

export const miniature = (url: string | null) => url && url.startsWith('/photos/') ? url.replace('.webp', '-mini.webp') : url
