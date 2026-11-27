import { useEffect, useState } from 'react'
import { supabase, RESTAURANT_SLUG } from './supabase'
import type { Plat, Restaurant, Service } from './types'
import { lireEtatDemo } from './demo'

export function useRestaurant() {
  const [data, setData] = useState<{ restaurant: Restaurant; plats: Plat[]; services: Service[] } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    let nettoyer = () => {}
    ;(async () => {
      const { data: r, error } = await supabase.from('resto_restaurants').select('*').eq('slug', RESTAURANT_SLUG).single()
      if (error || !r) { if (!annule) setErreur('Impossible de charger le restaurant. Vérifiez votre connexion.'); return }
      const [p, s] = await Promise.all([
        supabase.from('resto_plats').select('*').eq('restaurant_id', r.id).eq('actif', true).order('ordre'),
        supabase.from('resto_services').select('*').eq('restaurant_id', r.id).eq('actif', true).order('ordre'),
      ])
      if (annule) return
      const base = { restaurant: r as Restaurant, plats: (p.data ?? []) as Plat[], services: (s.data ?? []) as Service[] }
      // Démo : afficher les changements faits dans l'espace gérant de ce téléphone
      let precedent = ''
      const appliquer = () => {
        const d = lireEtatDemo()
        const signature = d ? String(d.maj) : 'base'
        if (signature === precedent) return
        precedent = signature
        setData(d ? { ...base, plats: [...d.plats].filter(x => x.actif).sort((a, b) => a.ordre - b.ordre) } : base)
      }
      appliquer()
      window.addEventListener('storage', appliquer)
      window.addEventListener('focus', appliquer)
      nettoyer = () => { window.removeEventListener('storage', appliquer); window.removeEventListener('focus', appliquer) }
    })()
    return () => { annule = true; nettoyer() }
  }, [])

  return { data, erreur }
}
