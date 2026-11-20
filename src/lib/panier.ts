import { useEffect, useState } from 'react'

export type Panier = Record<string, number>
const CLE = 'resto-panier-v1'

export function usePanier() {
  const [panier, setPanier] = useState<Panier>(() => {
    try { return JSON.parse(localStorage.getItem(CLE) || '{}') } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(CLE, JSON.stringify(panier)) } catch { /* stockage indisponible */ } }, [panier])

  const changer = (id: string, delta: number) => setPanier(p => {
    const q = Math.max(0, Math.min(50, (p[id] || 0) + delta))
    const n = { ...p }
    if (q === 0) delete n[id]; else n[id] = q
    return n
  })
  const vider = () => setPanier({})
  return { panier, changer, vider }
}
