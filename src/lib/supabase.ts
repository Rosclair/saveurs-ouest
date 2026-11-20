import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://lrvbdvhyprpgfwhwsvky.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OR8rp_8njwRv5OsKugfAnQ__Nhm3cdL'
export const RESTAURANT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || 'saveurs-ouest'

export const supabase = createClient(url, key)
