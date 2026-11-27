import { supabase, RESTAURANT_SLUG } from './supabase'
import type { Plat, Reservation, Restaurant } from './types'
import { maintenantDouala } from './utils'
import { effacerEtatDemo, ecrireEtatDemo, lireEtatDemo, mesReservations, reservationsExemple, sessionDemo, type EtatDemo } from './demo'

export type Filtre = 'avenir' | 'toutes'

/** Accès aux données de l'espace gérant : base Supabase (vrai compte) ou bac à sable (démo) */
export interface Depot {
  demo: boolean
  resto: Restaurant
  plats(): Promise<Plat[]>
  majPlats(ids: string[], patch: Partial<Plat>): Promise<void>
  ajouterPlat(val: Partial<Plat>): Promise<void>
  supprimerPlat(id: string): Promise<void>
  photo(blob: Blob): Promise<string>
  reservations(filtre: Filtre): Promise<Reservation[]>
  statut(id: string, s: Reservation['statut']): Promise<void>
  reinitialiser?(): Promise<void>
  deconnexion(): Promise<void>
}

const filtrer = (l: Reservation[], f: Filtre) => {
  const auj = maintenantDouala().iso
  const v = f === 'avenir' ? l.filter(r => r.date >= auj && r.statut !== 'annulee' && r.statut !== 'terminee') : l
  return [...v].sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))
}

export async function depotSupabase(restaurantId: string): Promise<Depot> {
  const { data, error } = await supabase.from('resto_restaurants').select('*').eq('id', restaurantId).single()
  if (error || !data) throw new Error('restaurant')
  const resto = data as Restaurant
  return {
    demo: false,
    resto,
    async plats() {
      const { data } = await supabase.from('resto_plats').select('*').eq('restaurant_id', resto.id).order('ordre')
      return (data ?? []) as Plat[]
    },
    async majPlats(ids, patch) {
      if (!ids.length) return
      const { error } = await supabase.from('resto_plats').update(patch).in('id', ids)
      if (error) throw error
    },
    async ajouterPlat(val) {
      const { error } = await supabase.from('resto_plats').insert({ ...val, restaurant_id: resto.id })
      if (error) throw error
    },
    async supprimerPlat(id) {
      const { error } = await supabase.from('resto_plats').delete().eq('id', id)
      if (error) throw error
    },
    async photo(blob) {
      const chemin = `${resto.id}/${crypto.randomUUID()}.webp`
      const { error } = await supabase.storage.from('resto-photos').upload(chemin, blob, { contentType: 'image/webp', cacheControl: '31536000' })
      if (error) throw error
      return supabase.storage.from('resto-photos').getPublicUrl(chemin).data.publicUrl
    },
    async reservations(f) {
      let q = supabase.from('resto_reservations').select('*').eq('restaurant_id', resto.id).order('date').order('heure')
      if (f === 'avenir') q = q.gte('date', maintenantDouala().iso).not('statut', 'in', '(annulee,terminee)')
      const { data } = await q.limit(200)
      return (data ?? []) as Reservation[]
    },
    async statut(id, s) {
      const { error } = await supabase.from('resto_reservations').update({ statut: s }).eq('id', id)
      if (error) throw error
    },
    async deconnexion() { await supabase.auth.signOut() },
  }
}

export async function depotDemo(): Promise<Depot> {
  const { data, error } = await supabase.from('resto_restaurants').select('*').eq('slug', RESTAURANT_SLUG).single()
  if (error || !data) throw new Error('restaurant')
  const resto = data as Restaurant

  async function etat(): Promise<EtatDemo> {
    const e = lireEtatDemo()
    if (e) return e
    const { data } = await supabase.from('resto_plats').select('*').eq('restaurant_id', resto.id).eq('actif', true).order('ordre')
    const neuf: EtatDemo = { plats: (data ?? []) as Plat[], statuts: {}, maj: Date.now() }
    ecrireEtatDemo(neuf)
    return neuf
  }
  async function modifier(f: (e: EtatDemo) => void) {
    const e = await etat()
    f(e)
    ecrireEtatDemo(e)
  }

  return {
    demo: true,
    resto,
    async plats() { return [...(await etat()).plats].sort((a, b) => a.ordre - b.ordre) },
    async majPlats(ids, patch) {
      await modifier(e => { e.plats = e.plats.map(p => ids.includes(p.id) ? { ...p, ...patch } : p) })
    },
    async ajouterPlat(val) {
      await modifier(e => {
        e.plats.push({
          id: crypto.randomUUID(), restaurant_id: resto.id, nom: '', description: null, prix: 0, photo_url: null,
          categorie: 'Plats', du_jour: false, plat_du_chef: false, actif: true, ordre: e.plats.length + 1, ...val,
        } as Plat)
      })
    },
    async supprimerPlat(id) { await modifier(e => { e.plats = e.plats.filter(p => p.id !== id) }) },
    async photo(blob) {
      return new Promise<string>((ok, ko) => {
        const r = new FileReader()
        r.onload = () => ok(String(r.result))
        r.onerror = () => ko(new Error('photo'))
        r.readAsDataURL(blob)
      })
    },
    async reservations(f) {
      const e = await etat()
      const toutes = [...mesReservations(), ...reservationsExemple(resto, e.plats)]
        .map(r => (e.statuts[r.id] ? { ...r, statut: e.statuts[r.id] } : r))
      return filtrer(toutes, f)
    },
    async statut(id, s) { await modifier(e => { e.statuts[id] = s }) },
    async reinitialiser() { effacerEtatDemo() },
    async deconnexion() { sessionDemo.fermer() },
  }
}
