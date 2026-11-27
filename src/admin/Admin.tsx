import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Plat, Reservation } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { dateLongue, fcfa, hFr, lienWhatsApp, maintenantDouala, miniature } from '../lib/utils'
import { depotDemo, depotSupabase, type Depot, type Filtre } from '../lib/depot'
import { estIdentifiantDemo, sessionDemo } from '../lib/demo'
import { Icone, IconeWhatsApp, Logo } from '../site/ui'

export default function Admin() {
  // undefined : chargement · null : écran de connexion · Depot : espace gérant
  const [depot, setDepot] = useState<Depot | null | undefined>(undefined)
  const [erreur, setErreur] = useState('')

  const ouvrirDemo = useCallback(async () => {
    try { setDepot(await depotDemo()) } catch { setErreur('Connexion impossible. Vérifiez votre réseau.'); setDepot(null) }
  }, [])

  useEffect(() => {
    if (sessionDemo.ouverte()) { ouvrirDemo(); return }
    const charger = async (userId: string | null) => {
      if (!userId) { setDepot(null); return }
      const { data: lien } = await supabase.from('resto_admins').select('restaurant_id').eq('user_id', userId).limit(1).maybeSingle()
      if (!lien) { setErreur('Ce compte n\'est relié à aucun restaurant.'); setDepot(null); await supabase.auth.signOut(); return }
      try { setDepot(await depotSupabase(lien.restaurant_id)) } catch { setErreur('Connexion impossible. Vérifiez votre réseau.'); setDepot(null) }
    }
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === 'INITIAL_SESSION' || ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(() => charger(s?.user.id ?? null), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [ouvrirDemo])

  if (depot === undefined) return <div className="grid min-h-screen place-items-center bg-cafe text-creme">Chargement…</div>
  if (!depot) return <Connexion erreurInitiale={erreur} onDemo={() => { setErreur(''); ouvrirDemo() }} />
  return <Espace depot={depot} onDeconnexion={async () => { await depot.deconnexion(); setDepot(null) }} />
}

function Connexion({ erreurInitiale, onDemo }: { erreurInitiale: string; onDemo: () => void }) {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState(erreurInitiale)
  const [envoi, setEnvoi] = useState(false)
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErreur('')
    if (estIdentifiantDemo(email, mdp)) { sessionDemo.ouvrir(); onDemo(); return }
    setEnvoi(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp })
    setEnvoi(false)
    if (error) setErreur('Identifiants incorrects.')
  }
  const champ = 'w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-cafe ring-1 ring-cafe/10 focus:outline-none focus:ring-2 focus:ring-ocre'
  return (
    <div className="relative grid min-h-screen place-items-center bg-cafe p-5">
      <div className="ndop absolute inset-0 opacity-[0.06]" />
      <form onSubmit={go} className="relative w-full max-w-sm rounded-[2rem] bg-creme p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-cafe">Espace gérant</h1>
        <p className="mt-1 text-sm text-gris">Gérez votre menu du jour et vos réservations.</p>
        <div className="mt-6 space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" autoComplete="username" autoCapitalize="none" required className={champ} />
          <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} placeholder="Mot de passe" autoComplete="current-password" required className={champ} />
        </div>
        {erreur && <p role="alert" className="mt-4 text-sm text-terre">{erreur}</p>}
        <button disabled={envoi} className="mt-6 w-full rounded-full bg-cafe py-4 font-semibold text-creme transition hover:bg-terre disabled:opacity-60">{envoi ? 'Connexion…' : 'Se connecter'}</button>
        <a href="/" className="mt-5 block text-center text-sm text-gris hover:text-cafe">← Retour au site</a>
      </form>
    </div>
  )
}

type Onglet = 'jour' | 'reservations' | 'plats'

function Espace({ depot, onDeconnexion }: { depot: Depot; onDeconnexion: () => void }) {
  const [onglet, setOnglet] = useState<Onglet>('jour')
  const [plats, setPlats] = useState<Plat[]>([])
  const [version, setVersion] = useState(0)

  const chargerPlats = useCallback(async () => { setPlats(await depot.plats()) }, [depot])
  useEffect(() => { chargerPlats() }, [chargerPlats, version])

  async function reinitialiser() {
    if (!depot.reinitialiser || !confirm('Revenir à la démo de départ ? Vos changements seront effacés.')) return
    await depot.reinitialiser()
    setVersion(v => v + 1)
  }

  const onglets: { id: Onglet; t: string }[] = [{ id: 'jour', t: 'Menu du jour' }, { id: 'reservations', t: 'Réservations' }, { id: 'plats', t: 'Mes plats' }]
  return (
    <div className="min-h-screen bg-papier pb-16">
      {depot.demo && (
        <div data-demo-bandeau className="bg-ocre px-4 py-2 text-center text-[13px] font-medium text-cafe">
          Mode démo : vos changements restent sur ce téléphone et s'affichent sur le site.{' '}
          <button onClick={reinitialiser} className="font-bold underline underline-offset-2">Réinitialiser</button>
        </div>
      )}
      <header className="sticky top-0 z-30 bg-cafe text-creme shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Logo clair />
          <div className="flex items-center gap-4 text-sm">
            <a href="/" target="_blank" className="hidden text-creme/70 hover:text-ocre sm:inline">Voir le site ↗</a>
            <button onClick={onDeconnexion} className="rounded-full px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/10">Déconnexion</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-3">
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex-1 border-b-[3px] px-3 py-3 text-sm font-semibold transition sm:flex-none sm:px-5 ${onglet === o.id ? 'border-ocre text-creme' : 'border-transparent text-creme/55 hover:text-creme'}`}>{o.t}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-5 pt-8">
        {onglet === 'jour' && <MenuJour key={version} depot={depot} plats={plats} recharger={chargerPlats} />}
        {onglet === 'reservations' && <Reservations key={version} depot={depot} />}
        {onglet === 'plats' && <GestionPlats depot={depot} plats={plats} recharger={chargerPlats} />}
      </main>
    </div>
  )
}

function Interrupteur({ actif, onClick, label }: { actif: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={actif} aria-label={label} onClick={onClick}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${actif ? 'bg-feuille' : 'bg-cafe/15'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${actif ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

function MenuJour({ depot, plats, recharger }: { depot: Depot; plats: Plat[]; recharger: () => void }) {
  const [maj, setMaj] = useState<Record<string, Partial<Plat>>>({})
  const vue = plats.filter(p => p.actif).map(p => ({ ...p, ...maj[p.id] }))
  const nb = vue.filter(p => p.du_jour).length

  async function basculer(p: Plat) {
    const val = !p.du_jour
    setMaj(m => ({ ...m, [p.id]: { ...m[p.id], du_jour: val, ...(val ? {} : { plat_du_chef: false }) } }))
    await depot.majPlats([p.id], { du_jour: val, ...(val ? {} : { plat_du_chef: false }) })
  }
  async function chef(p: Plat) {
    const ids = plats.filter(x => x.plat_du_chef && x.id !== p.id).map(x => x.id)
    const n: Record<string, Partial<Plat>> = {}
    ids.forEach(id => { n[id] = { plat_du_chef: false } })
    n[p.id] = { plat_du_chef: true, du_jour: true }
    setMaj(m => ({ ...m, ...n }))
    await depot.majPlats(ids, { plat_du_chef: false })
    await depot.majPlats([p.id], { plat_du_chef: true, du_jour: true })
  }
  async function toutDecocher() {
    const n: Record<string, Partial<Plat>> = {}
    plats.forEach(p => { n[p.id] = { du_jour: false, plat_du_chef: false } })
    setMaj(n)
    await depot.majPlats(plats.map(p => p.id), { du_jour: false, plat_du_chef: false })
    recharger()
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-terre">{dateLongue(maintenantDouala().iso)}</p>
          <h1 className="mt-1 font-display text-4xl text-cafe">Menu du jour</h1>
          <p className="mt-1 text-gris">{nb} plat{nb > 1 ? 's' : ''} affiché{nb > 1 ? 's' : ''} sur le site. Les changements sont visibles immédiatement.</p>
        </div>
        <button onClick={toutDecocher} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cafe ring-1 ring-cafe/10 hover:bg-creme">Tout décocher</button>
      </div>
      <ul className="mt-8 divide-y divide-cafe/8 overflow-hidden rounded-3xl bg-white shadow-[0_2px_30px_-12px_rgba(33,21,13,.25)]">
        {vue.map(p => (
          <li key={p.id} className={`flex items-center gap-4 p-4 transition ${p.du_jour ? 'bg-feuille/[0.04]' : ''}`}>
            {p.photo_url ? <img src={miniature(p.photo_url) ?? ''} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" /> : <span className="ndop h-14 w-14 shrink-0 rounded-2xl bg-cafe-2" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-cafe">{p.nom}</p>
              <p className="text-sm text-gris">{p.categorie} · {fcfa(p.prix)}</p>
            </div>
            <button onClick={() => chef(p)} title="Plat du chef" aria-label="Définir comme plat du chef"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${p.plat_du_chef ? 'bg-ocre text-cafe' : 'text-cafe/25 hover:text-ocre'}`}>
              <Icone nom="etoile" className="h-5 w-5" />
            </button>
            <Interrupteur actif={p.du_jour} onClick={() => basculer(p)} label={`Afficher ${p.nom} aujourd'hui`} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-gris">★ = plat du chef, mis en grand en haut du menu du jour.</p>
    </div>
  )
}

const STATUTS: Record<Reservation['statut'], { t: string; c: string }> = {
  demandee: { t: 'Demandée', c: 'bg-ocre/20 text-ocre-fonce' },
  confirmee: { t: 'Confirmée', c: 'bg-blue-100 text-blue-800' },
  payee: { t: 'Payée', c: 'bg-feuille/15 text-feuille' },
  terminee: { t: 'Terminée', c: 'bg-cafe/10 text-cafe' },
  annulee: { t: 'Annulée', c: 'bg-terre/15 text-terre' },
}

function Reservations({ depot }: { depot: Depot }) {
  const resto = depot.resto
  const [liste, setListe] = useState<Reservation[] | null>(null)
  const [filtre, setFiltre] = useState<Filtre>('avenir')
  const charger = useCallback(async () => {
    setListe(await depot.reservations(filtre))
  }, [depot, filtre])
  useEffect(() => { charger() }, [charger])

  async function statut(r: Reservation, s: Reservation['statut']) {
    setListe(l => l?.map(x => x.id === r.id ? { ...x, statut: s } : x) ?? null)
    await depot.statut(r.id, s)
  }

  const telWa = (t: string) => { const d = t.replace(/\D/g, ''); return d.length === 9 ? '237' + d : d }
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-cafe">Réservations</h1>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-cafe/10">
          {(['avenir', 'toutes'] as const).map(f => <button key={f} onClick={() => setFiltre(f)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filtre === f ? 'bg-cafe text-creme' : 'text-cafe'}`}>{f === 'avenir' ? 'À venir' : 'Toutes'}</button>)}
        </div>
      </div>
      {liste === null && <p className="mt-8 text-gris">Chargement…</p>}
      {liste?.length === 0 && <div className="mt-8 rounded-3xl bg-creme p-10 text-center text-gris">Aucune réservation pour le moment.</div>}
      <div className="mt-8 space-y-4">
        {liste?.map(r => (
          <article key={r.id} className="rounded-3xl bg-white p-5 shadow-[0_2px_30px_-12px_rgba(33,21,13,.25)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-terre">{r.reference}</p>
                <h3 className="font-display text-2xl text-cafe">{r.nom}</h3>
                <p className="text-gris">{dateLongue(r.date)} à {hFr(r.heure)} · {r.personnes} pers.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUTS[r.statut].c}`}>{STATUTS[r.statut].t}</span>
            </div>
            {r.plats.length > 0 && (
              <div className="mt-4 rounded-2xl bg-papier p-4 text-sm">
                {r.plats.map(l => <p key={l.plat_id} className="flex justify-between"><span>{l.quantite}× {l.nom}</span><span>{fcfa(l.prix * l.quantite)}</span></p>)}
                <p className="mt-2 flex justify-between border-t border-cafe/10 pt-2 font-semibold"><span>Total</span><span>{fcfa(r.total)}</span></p>
              </div>
            )}
            {r.note && <p className="mt-3 text-sm italic text-gris">« {r.note} »</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {r.telephone && <a href={lienWhatsApp(telWa(r.telephone), `Bonjour ${r.nom}, concernant votre réservation ${r.reference} chez ${resto.nom} : `)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-cafe"><IconeWhatsApp className="h-4 w-4" /> Écrire</a>}
              {(['confirmee', 'payee', 'terminee', 'annulee'] as const).filter(s => s !== r.statut).map(s => (
                <button key={s} onClick={() => statut(r, s)} className="rounded-full px-4 py-2 text-sm font-semibold text-cafe ring-1 ring-cafe/15 hover:bg-creme">{STATUTS[s].t}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

async function compresser(f: File, max = 900): Promise<Blob> {
  const img = await createImageBitmap(f)
  const l = Math.min(max, img.width)
  const h = Math.round(img.height * (l / img.width))
  const c = document.createElement('canvas')
  c.width = l; c.height = h
  c.getContext('2d')!.drawImage(img, 0, 0, l, h)
  return new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error('compression')), 'image/webp', 0.78))
}

const VIDE = { nom: '', description: '', prix: '', categorie: 'Plats' }

function GestionPlats({ depot, plats, recharger }: { depot: Depot; plats: Plat[]; recharger: () => void }) {
  const [edition, setEdition] = useState<Plat | 'nouveau' | null>(null)
  const [f, setF] = useState(VIDE)
  const [photo, setPhoto] = useState<File | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  function ouvrir(p: Plat | 'nouveau') {
    setEdition(p); setPhoto(null); setErreur('')
    setF(p === 'nouveau' ? VIDE : { nom: p.nom, description: p.description ?? '', prix: String(p.prix), categorie: p.categorie })
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    const prix = parseInt(f.prix.replace(/\D/g, ''), 10)
    if (!f.nom.trim() || !prix) { setErreur('Le nom et le prix sont obligatoires.'); return }
    setEnvoi(true); setErreur('')
    try {
      let photo_url = edition !== 'nouveau' && edition ? edition.photo_url : null
      if (photo) {
        photo_url = await depot.photo(await compresser(photo, depot.demo ? 640 : 900))
      }
      const val = { nom: f.nom.trim(), description: f.description.trim() || null, prix, categorie: f.categorie, photo_url }
      if (edition === 'nouveau') await depot.ajouterPlat({ ...val, ordre: plats.length + 1 })
      else await depot.majPlats([(edition as Plat).id], val)
      setEdition(null); recharger()
    } catch {
      setErreur('L\'enregistrement a échoué. Vérifiez la connexion.')
    } finally { setEnvoi(false) }
  }

  async function supprimer(p: Plat) {
    if (!confirm(`Supprimer définitivement « ${p.nom} » ?`)) return
    await depot.supprimerPlat(p.id)
    setEdition(null); recharger()
  }

  const champ = 'w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-cafe ring-1 ring-cafe/10 focus:outline-none focus:ring-2 focus:ring-ocre'
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-cafe">Mes plats</h1>
          <p className="mt-1 text-gris">{plats.length} plats au catalogue.</p>
        </div>
        <button onClick={() => ouvrir('nouveau')} className="rounded-full bg-terre px-5 py-3 font-semibold text-white shadow-lg shadow-terre/25 hover:bg-terre-fonce">+ Ajouter un plat</button>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {plats.map(p => (
          <button key={p.id} onClick={() => ouvrir(p)} className="flex items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-[0_2px_20px_-12px_rgba(33,21,13,.3)] transition hover:ring-2 hover:ring-ocre">
            {p.photo_url ? <img src={miniature(p.photo_url) ?? ''} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className="ndop grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-cafe-2 text-[10px] text-creme/60">Sans photo</span>}
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-cafe">{p.nom}</span><span className="text-sm text-gris">{p.categorie} · {fcfa(p.prix)}</span></span>
            <span className="pr-2 text-cafe/30">✎</span>
          </button>
        ))}
      </div>

      {edition && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-cafe/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setEdition(null)}>
          <form onSubmit={enregistrer} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-creme p-7 sm:rounded-[2rem]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cafe">{edition === 'nouveau' ? 'Nouveau plat' : 'Modifier le plat'}</h2>
              <button type="button" onClick={() => setEdition(null)} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">×</button>
            </div>
            <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-cafe/10">
              {photo ? <img src={URL.createObjectURL(photo)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                : edition !== 'nouveau' && edition.photo_url ? <img src={miniature(edition.photo_url) ?? ''} alt="" className="h-20 w-20 rounded-xl object-cover" />
                : <span className="grid h-20 w-20 place-items-center rounded-xl bg-creme-2 text-2xl text-cafe/40">📷</span>}
              <span className="text-sm"><span className="block font-semibold text-cafe">Photo du plat</span><span className="text-gris">Touchez pour choisir ou prendre une photo</span></span>
              <input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <div className="mt-4 space-y-4">
              <input value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="Nom du plat" required className={champ} />
              <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Courte description" rows={2} maxLength={200} className={champ} />
              <div className="grid grid-cols-2 gap-4">
                <input value={f.prix} onChange={e => setF({ ...f, prix: e.target.value })} inputMode="numeric" placeholder="Prix (FCFA)" required className={champ} />
                <select value={f.categorie} onChange={e => setF({ ...f, categorie: e.target.value })} className={champ}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {erreur && <p role="alert" className="mt-4 text-sm text-terre">{erreur}</p>}
            <button disabled={envoi} className="mt-6 w-full rounded-full bg-cafe py-4 font-semibold text-creme hover:bg-terre disabled:opacity-60">{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
            {edition !== 'nouveau' && <button type="button" onClick={() => supprimer(edition)} className="mt-3 w-full py-2 text-sm font-semibold text-terre">Supprimer ce plat</button>}
          </form>
        </div>
      )}
    </div>
  )
}
