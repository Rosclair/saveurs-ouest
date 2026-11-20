export type Horaires = Record<string, [string, string] | null>
export type MoyenPaiement = { moyen: string; beneficiaire: string; numero: string }

export type Restaurant = {
  id: string; slug: string; nom: string; slogan: string | null; description: string | null
  logo_url: string | null; couverture_url: string | null; whatsapp: string; telephone: string | null
  adresse: string | null; repere: string | null; ville: string | null; maps_url: string | null
  horaires: Horaires; paiement: MoyenPaiement[]; acompte_pourcent: number; tag_whatsapp: string
}

export type Plat = {
  id: string; restaurant_id: string; nom: string; description: string | null; prix: number
  photo_url: string | null; categorie: string; du_jour: boolean; plat_du_chef: boolean; actif: boolean; ordre: number
}

export type Service = {
  id: string; restaurant_id: string; titre: string; description: string | null; photo_url: string | null
  prix_indicatif: string | null; actif: boolean; ordre: number
}

export type LigneReservation = { plat_id: string; nom: string; prix: number; quantite: number }

export type Reservation = {
  id: string; restaurant_id: string; reference: string; nom: string; telephone: string; date: string; heure: string
  personnes: number; plats: LigneReservation[]; total: number; note: string | null
  statut: 'demandee' | 'confirmee' | 'payee' | 'annulee' | 'terminee'; created_at: string
}

export const CATEGORIES = ['Entrées', 'Plats', 'Grillades', 'Accompagnements', 'Boissons', 'Desserts']
