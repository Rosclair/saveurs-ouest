import { useEffect, useState } from 'react'
import { supabase, RESTAURANT_SLUG } from './supabase'
import type { Plat, Restaurant, Service } from './types'

export function useRestaurant() {
  const [data, setData] = useState<{ restaurant: Restaurant; plats: Plat[]; services: Service[] } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const { data: r, error } = await supabase.from('resto_restaurants').select('*').eq('slug', RESTAURANT_SLUG).single()
      if (error || !r) { if (!annule) setErreur('Impossible de charger le restaurant. Vérifiez votre connexion.'); return }
      const [p, s] = await Promise.all([
        supabase.from('resto_plats').select('*').eq('restaurant_id', r.id).eq('actif', true).order('ordre'),
        supabase.from('resto_services').select('*').eq('restaurant_id', r.id).eq('actif', true).order('ordre'),
      ])
      if (!annule) setData({ restaurant: r as Restaurant, plats: (p.data ?? []) as Plat[], services: (s.data ?? []) as Service[] })
    })()
    return () => { annule = true }
  }, [])

  return { data, erreur }
}
