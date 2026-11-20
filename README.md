# Saveurs de l'Ouest — modèle de site restaurant

Site vitrine (menu du jour, réservation WhatsApp, traiteur) + espace gérant (`/admin`).
React + Vite + Tailwind, données dans Supabase (tables `resto_*`, un seul projet pour tous les restaurants).

## Nouveau restaurant
1. Insérer une ligne dans `resto_restaurants` (slug unique), ses plats et services.
2. Créer le compte du gérant et le lier dans `resto_admins`.
3. Déployer ce dépôt avec la variable `VITE_RESTAURANT_SLUG=<slug>`.

Variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RESTAURANT_SLUG` (valeurs par défaut dans `src/lib/supabase.ts`).
