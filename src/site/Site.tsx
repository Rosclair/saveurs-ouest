import { useEffect, useMemo, useState } from 'react'
import { useRestaurant } from '../lib/useRestaurant'
import { usePanier } from '../lib/panier'
import { useReveal } from '../lib/reveal'
import type { Plat, Restaurant, Service } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { dateLongue, fcfa, hFr, JOURS, lienWhatsApp, maintenantDouala, messageQuestion, miniature, statutOuverture } from '../lib/utils'
import { Icone, IconeWhatsApp, Logo, Stepper, Surtitre } from './ui'
import { Reservation } from './Reservation'
import { DevisModal } from './DevisModal'
import { InstallPWA } from './InstallPWA'

export default function Site() {
  const { data, erreur } = useRestaurant()
  const { panier, changer, vider } = usePanier()
  const [toast, setToast] = useState<string | null>(null)
  const [devis, setDevis] = useState<Service | null>(null)
  useReveal(data)

  // Liens directs : #menu-du-jour, #reserver… défilent vers la section une fois les données chargées ;
  // #devis, #devis-mariage, #devis-entreprise, #devis-livraison ouvrent directement le formulaire de devis.
  useEffect(() => {
    if (!data) return
    const appliquer = () => {
      const h = decodeURIComponent(window.location.hash.slice(1)).toLowerCase()
      if (!h) return
      if (h.startsWith('devis')) {
        const cle = h.replace(/^devis-?/, '')
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        const s = cle ? data.services.find(x => norm(x.titre).includes(cle)) : data.services[0]
        if (s) { document.getElementById('services')?.scrollIntoView(); setDevis(s) }
        return
      }
      setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }), 150)
    }
    appliquer()
    window.addEventListener('hashchange', appliquer)
    return () => window.removeEventListener('hashchange', appliquer)
  }, [data])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (erreur) return <div className="grid min-h-screen place-items-center bg-cafe p-8 text-center text-creme">{erreur}</div>
  if (!data) return <Chargement />

  const { restaurant: r, plats, services } = data
  const ajouter = (p: Plat, delta = 1) => {
    changer(p.id, delta)
    if (delta > 0 && !panier[p.id]) setToast(`${p.nom} ajouté à votre réservation`)
  }
  const nbArticles = Object.values(panier).reduce((a, b) => a + b, 0)

  return (
    <div className="pb-20 md:pb-0">
      <Entete r={r} nbArticles={nbArticles} />
      <Hero r={r} plats={plats} />
      <Bandeau plats={plats} />
      <MenuDuJour plats={plats} panier={panier} ajouter={ajouter} />
      <CommentCaMarche />
      <Reservation r={r} plats={plats} panier={panier} changer={changer} vider={vider} />
      <Carte plats={plats} panier={panier} ajouter={ajouter} />
      <Services services={services} onDevis={setDevis} />
      <Infos r={r} />
      <PiedDePage r={r} />
      <BarreMobile r={r} nbArticles={nbArticles} />
      <InstallPWA />
      {devis && <DevisModal r={r} service={devis} services={services} onFermer={() => setDevis(null)} />}
      <div aria-live="polite" className={`fixed inset-x-0 top-20 z-50 flex justify-center px-4 transition-all duration-300 md:top-auto md:bottom-8 ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'}`}>
        <a href="#reserver" className="flex items-center gap-3 rounded-full bg-cafe px-5 py-3 text-sm text-creme shadow-2xl shadow-cafe/40">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-feuille"><Icone nom="check" className="h-4 w-4" /></span>
          {toast}
          <span className="font-semibold text-ocre">Voir →</span>
        </a>
      </div>
    </div>
  )
}

function Chargement() {
  return (
    <div className="grid min-h-screen place-items-center bg-cafe">
      <div className="flex flex-col items-center gap-5">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-ocre/20 border-t-ocre" />
        <p className="font-display text-lg italic text-creme/80">On dresse la table…</p>
      </div>
    </div>
  )
}

function Entete({ r, nbArticles }: { r: Restaurant; nbArticles: number }) {
  const [defile, setDefile] = useState(false)
  useEffect(() => {
    const f = () => setDefile(window.scrollY > 40)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${defile ? 'bg-papier/90 shadow-[0_1px_0_rgba(33,21,13,.08)] backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20">
        <a href="#top" aria-label={r.nom}><Logo clair={!defile} /></a>
        <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${defile ? 'text-cafe' : 'text-creme/90'}`}>
          <a href="#menu-du-jour" className="hover:text-ocre">Menu du jour</a>
          <a href="#carte" className="hover:text-ocre">La carte</a>
          <a href="#services" className="hover:text-ocre">Traiteur</a>
          <a href="#infos" className="hover:text-ocre">Infos</a>
        </nav>
        <a href="#reserver" className="relative rounded-full bg-terre px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-terre/30 transition hover:bg-terre-fonce">
          Réserver
          {nbArticles > 0 && <span key={nbArticles} className="pop absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ocre px-1 text-[11px] font-bold text-cafe">{nbArticles}</span>}
        </a>
      </div>
    </header>
  )
}

function Hero({ r, plats }: { r: Restaurant; plats: Plat[] }) {
  const statut = statutOuverture(r.horaires)
  const duJour = plats.filter(p => p.du_jour)
  const chef = duJour.find(p => p.plat_du_chef) ?? duJour[0]
  const photos = duJour.filter(p => p.photo_url && p.id !== chef?.id).slice(0, 2)
  return (
    <section id="top" className="relative overflow-hidden bg-cafe text-creme">
      <div className="ndop absolute inset-0 opacity-[0.07]" />
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-terre/25 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-ocre/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-28 md:grid-cols-[1.05fr_1fr] md:pb-32 md:pt-36">
        <div className="order-2 md:order-1">
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/8 px-4 py-2 text-sm ring-1 ring-white/15 backdrop-blur">
            <span className={`h-2.5 w-2.5 rounded-full ${statut.ouvert ? 'pulse-dot bg-green-400' : 'bg-red-400'}`} />
            {statut.texte}
          </span>
          <h1 className="font-display text-[2.7rem] font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Le goût de l'Ouest,<br />
            <em className="font-normal text-ocre">servi chaque jour.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-creme/75">
            Découvrez ce que le chef cuisine aujourd'hui, réservez votre table et commandez votre plat sur WhatsApp. <span className="text-creme">Il vous attend à votre arrivée.</span>
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#menu-du-jour" className="group inline-flex items-center justify-center gap-2 rounded-full bg-ocre px-7 py-4 font-semibold text-cafe shadow-xl shadow-ocre/20 transition hover:bg-[#e6b354]">
              Voir le menu du jour
              <Icone nom="fleche" className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
            <a href="#reserver" className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-semibold text-creme ring-1 ring-creme/30 transition hover:bg-white/10">
              <IconeWhatsApp /> Réserver une table
            </a>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
            <div><dt className="font-display text-3xl text-ocre">{duJour.length}</dt><dd className="mt-1 text-creme/60">plats aujourd'hui</dd></div>
            <div><dt className="font-display text-3xl text-ocre">1 min</dt><dd className="mt-1 text-creme/60">pour réserver</dd></div>
            <div><dt className="font-display text-3xl text-ocre">500</dt><dd className="mt-1 text-creme/60">invités en traiteur</dd></div>
          </dl>
        </div>

        <div className="relative order-1 mx-auto h-[360px] w-full max-w-[440px] sm:h-[460px] md:order-2 md:h-[540px]">
          {chef?.photo_url && (
            <div className="flotte absolute left-[8%] top-0 w-[68%] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/50 ring-1 ring-white/10" style={{ ['--r' as string]: '-3deg' }}>
              <img src={chef.photo_url} alt={chef.nom} className="aspect-[4/5] w-full object-cover" fetchPriority="high" />
            </div>
          )}
          {photos[0]?.photo_url && (
            <div className="flotte absolute bottom-2 right-0 w-[46%] overflow-hidden rounded-[1.6rem] shadow-2xl shadow-black/50 ring-4 ring-cafe" style={{ ['--r' as string]: '5deg', animationDelay: '-2.5s' }}>
              <img src={photos[0].photo_url} alt={photos[0].nom} className="aspect-[4/5] w-full object-cover" />
            </div>
          )}
          {photos[1]?.photo_url && (
            <div className="flotte absolute bottom-10 left-0 hidden h-28 w-28 overflow-hidden rounded-full shadow-2xl shadow-black/50 ring-4 ring-cafe sm:block" style={{ animationDelay: '-4s' }}>
              <img src={miniature(photos[1].photo_url) ?? ''} alt={photos[1].nom} className="h-full w-full object-cover" />
            </div>
          )}
          {chef && (
            <a href="#menu-du-jour" className="absolute right-[2%] top-[14%] rounded-2xl bg-creme px-4 py-3 text-cafe shadow-2xl shadow-black/40 transition hover:-translate-y-0.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-terre"><Icone nom="etoile" className="h-3.5 w-3.5" /> Plat du chef</span>
              <span className="mt-1 block font-display text-lg leading-tight">{chef.nom}</span>
              <span className="text-sm font-semibold text-ocre-fonce">{fcfa(chef.prix)}</span>
            </a>
          )}
        </div>
      </div>
      <svg className="absolute -bottom-px left-0 h-10 w-full text-papier md:h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0 80V40C240 0 480 0 720 30s480 50 720 10v40z" />
      </svg>
    </section>
  )
}

function Bandeau({ plats }: { plats: Plat[] }) {
  const mots = [...plats.filter(p => p.categorie === 'Plats' || p.categorie === 'Grillades').map(p => p.nom), 'Traiteur', 'Livraison en ville']
  const ligne = (
    <div className="flex shrink-0 items-center">
      {mots.map(m => <span key={m} className="flex items-center gap-6 px-6 font-display text-lg italic">{m}<span className="text-terre">✦</span></span>)}
    </div>
  )
  return (
    <div className="overflow-hidden border-y border-cafe/10 bg-papier py-4 text-cafe/70" aria-hidden="true">
      <div className="defile flex w-max">{ligne}{ligne}</div>
    </div>
  )
}

function CartePlat({ p, qte, ajouter }: { p: Plat; qte: number; ajouter: (p: Plat, d?: number) => void }) {
  return (
    <article className="reveal group flex flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_2px_30px_-10px_rgba(33,21,13,.25)] ring-1 ring-cafe/5 transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(33,21,13,.35)]">
      <div className="relative overflow-hidden">
        {p.photo_url
          ? <img src={p.photo_url} alt={p.nom} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="ndop grid aspect-[4/3] place-items-center bg-cafe-2"><span className="font-display text-2xl italic text-creme/80">{p.nom}</span></div>}
        <span className="absolute left-3 top-3 rounded-full bg-papier/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cafe backdrop-blur">{p.categorie}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-medium leading-snug text-cafe">{p.nom}</h3>
          <p className="shrink-0 whitespace-nowrap font-semibold text-terre">{fcfa(p.prix)}</p>
        </div>
        {p.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-gris">{p.description}</p>}
        <div className="mt-5">
          {qte > 0
            ? <div className="flex items-center justify-between"><span className="text-sm font-medium text-feuille">✓ Dans ma réservation</span><Stepper petit valeur={qte} onMoins={() => ajouter(p, -1)} onPlus={() => ajouter(p, 1)} /></div>
            : <button onClick={() => ajouter(p)} className="w-full rounded-full bg-cafe py-3 text-sm font-semibold text-creme transition hover:bg-terre">+ Ajouter à ma réservation</button>}
        </div>
      </div>
    </article>
  )
}

function MenuDuJour({ plats, panier, ajouter }: { plats: Plat[]; panier: Record<string, number>; ajouter: (p: Plat, d?: number) => void }) {
  const duJour = plats.filter(p => p.du_jour)
  const chef = duJour.find(p => p.plat_du_chef)
  const autres = duJour.filter(p => p.id !== chef?.id)
  const auj = dateLongue(maintenantDouala().iso)
  return (
    <section id="menu-du-jour" className="relative bg-papier py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Surtitre>Aujourd'hui · {auj}</Surtitre>
            <h2 className="font-display text-4xl font-medium tracking-tight text-cafe md:text-6xl">Le menu <em className="text-terre">du jour</em></h2>
          </div>
          <p className="max-w-sm text-gris">Cuisiné ce matin avec les produits du marché. Ajoutez vos plats, réservez, et ils seront prêts à votre arrivée.</p>
        </div>

        {duJour.length === 0 && (
          <div className="rounded-3xl bg-creme p-10 text-center">
            <p className="font-display text-2xl text-cafe">Le chef prépare le menu du jour…</p>
            <p className="mt-2 text-gris">Revenez dans un instant, ou consultez notre carte ci-dessous.</p>
          </div>
        )}

        {chef && (
          <article className="reveal mb-8 grid overflow-hidden rounded-[2rem] bg-cafe text-creme shadow-2xl shadow-cafe/30 md:grid-cols-2">
            <div className="relative">
              {chef.photo_url && <img src={chef.photo_url} alt={chef.nom} className="h-full max-h-[520px] w-full object-cover" />}
              <span className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-ocre px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cafe shadow-lg">
                <Icone nom="etoile" className="h-4 w-4" /> Le choix du chef
              </span>
            </div>
            <div className="relative flex flex-col justify-center p-8 md:p-12">
              <div className="ndop absolute inset-0 opacity-[0.05]" />
              <p className="relative text-sm font-semibold uppercase tracking-[0.25em] text-ocre">Plat signature du jour</p>
              <h3 className="relative mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">{chef.nom}</h3>
              {chef.description && <p className="relative mt-4 text-lg leading-relaxed text-creme/70">{chef.description}</p>}
              <p className="relative mt-6 font-display text-4xl text-ocre">{fcfa(chef.prix)}</p>
              <div className="relative mt-8">
                {panier[chef.id]
                  ? <div className="flex flex-wrap items-center gap-4"><Stepper valeur={panier[chef.id]} onMoins={() => ajouter(chef, -1)} onPlus={() => ajouter(chef, 1)} /><a href="#reserver" className="font-semibold text-ocre underline-offset-4 hover:underline">Finaliser ma réservation →</a></div>
                  : <button onClick={() => ajouter(chef)} className="rounded-full bg-ocre px-8 py-4 font-semibold text-cafe shadow-lg shadow-black/20 transition hover:bg-[#e6b354]">+ Je le réserve</button>}
              </div>
              <p className="relative mt-6 flex items-center gap-2 text-sm text-creme/50"><Icone nom="feu" className="h-4 w-4 text-terre" /> Quantité limitée chaque jour</p>
            </div>
          </article>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {autres.map(p => <CartePlat key={p.id} p={p} qte={panier[p.id] || 0} ajouter={ajouter} />)}
        </div>
      </div>
    </section>
  )
}

function CommentCaMarche() {
  const etapes = [
    { n: '01', t: 'Consultez le menu du jour', d: 'Mis à jour chaque matin. Vous savez ce qui vous attend avant de vous déplacer.', i: 'carte' as const },
    { n: '02', t: 'Réservez sur WhatsApp', d: 'Choisissez l\'heure et vos plats. Notre assistant confirme et vous indique comment régler.', i: 'calendrier' as const },
    { n: '03', t: 'Arrivez, c\'est prêt', d: 'Votre table et vos plats vous attendent. Zéro attente, zéro mauvaise surprise.', i: 'check' as const },
  ]
  return (
    <section className="relative overflow-hidden bg-cafe py-20 text-creme md:py-24">
      <div className="ndop absolute inset-0 opacity-[0.05]" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Surtitre clair>Simple comme bonjour</Surtitre>
          <h2 className="font-display text-4xl font-medium tracking-tight md:text-5xl">Votre plat vous attend, <em className="text-ocre">pas l'inverse.</em></h2>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {etapes.map(e => (
            <li key={e.n} className="reveal relative rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10">
              <span className="absolute right-6 top-5 font-display text-5xl text-white/10">{e.n}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ocre text-cafe"><Icone nom={e.i} className="h-6 w-6" /></span>
              <h3 className="mt-6 font-display text-2xl">{e.t}</h3>
              <p className="mt-2 leading-relaxed text-creme/65">{e.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Carte({ plats, panier, ajouter }: { plats: Plat[]; panier: Record<string, number>; ajouter: (p: Plat, d?: number) => void }) {
  const cats = useMemo(() => CATEGORIES.filter(c => plats.some(p => p.categorie === c)).concat([...new Set(plats.map(p => p.categorie))].filter(c => !CATEGORIES.includes(c))), [plats])
  const [cat, setCat] = useState<string>('Tout')
  const visibles = cat === 'Tout' ? cats : [cat]
  return (
    <section id="carte" className="bg-creme py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal text-center">
          <Surtitre>Tous les jours</Surtitre>
          <h2 className="font-display text-4xl font-medium tracking-tight text-cafe md:text-6xl">La <em className="text-terre">carte</em></h2>
        </div>
        <div className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 md:justify-center">
          {['Tout', ...cats].map(c => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${cat === c ? 'bg-cafe text-creme shadow-lg' : 'bg-white/70 text-cafe ring-1 ring-cafe/10 hover:bg-white'}`}>{c}</button>
          ))}
        </div>
        <div className="mt-12 grid gap-x-14 gap-y-12 md:grid-cols-2">
          {visibles.map(c => (
            <div key={c} className="reveal is-in min-w-0">
              <h3 className="mb-5 flex items-center gap-3 font-display text-2xl italic text-terre">{c}<span className="h-px flex-1 bg-terre/20" /></h3>
              <ul className="space-y-5">
                {plats.filter(p => p.categorie === c).map(p => (
                  <li key={p.id} className="flex items-center gap-4">
                    {p.photo_url && <img src={miniature(p.photo_url) ?? ''} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-end">
                        <span className="font-semibold text-cafe">{p.nom}</span>
                        {p.du_jour && <span className="ml-2 mb-0.5 rounded-full bg-feuille/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-feuille">Aujourd'hui</span>}
                        <span className="pointilles" />
                        <span className="whitespace-nowrap font-semibold text-cafe tabular-nums">{fcfa(p.prix)}</span>
                      </div>
                      {p.description && <p className="mt-0.5 truncate text-sm text-gris">{p.description}</p>}
                    </div>
                    {panier[p.id]
                      ? <Stepper petit valeur={panier[p.id]} onMoins={() => ajouter(p, -1)} onPlus={() => ajouter(p, 1)} />
                      : <button onClick={() => ajouter(p)} aria-label={`Ajouter ${p.nom}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xl text-cafe ring-1 ring-cafe/10 transition hover:bg-cafe hover:text-creme">+</button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Services({ services, onDevis }: { services: Service[]; onDevis: (s: Service) => void }) {
  if (!services.length) return null
  return (
    <section id="services" className="bg-papier py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <Surtitre>Traiteur & événements</Surtitre>
            <h2 className="font-display text-4xl font-medium tracking-tight text-cafe md:text-6xl">Vos grands jours, <em className="text-terre">notre cuisine.</em></h2>
          </div>
          <p className="text-gris md:justify-self-end md:max-w-sm">Mariage, dot, anniversaire, deuil, séminaire : décrivez votre événement en 30 secondes, nous vous répondons avec un devis sur WhatsApp.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((s, i) => (
            <article key={s.id} className={`reveal group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[1.8rem] text-creme ${i === 0 ? 'md:row-span-1' : ''}`}>
              {s.photo_url && <img src={s.photo_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-cafe via-cafe/70 to-cafe/5" />
              <div className="relative p-7">
                {s.prix_indicatif && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ocre">{s.prix_indicatif}</span>}
                <h3 className="mt-2 font-display text-2xl leading-tight">{s.titre}</h3>
                {s.description && <p className="mt-3 text-sm leading-relaxed text-creme/75">{s.description}</p>}
                <button onClick={() => onDevis(s)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-creme px-5 py-3 text-sm font-semibold text-cafe transition hover:bg-ocre">
                  Demander un devis <Icone nom="fleche" className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Infos({ r }: { r: Restaurant }) {
  const auj = maintenantDouala().jour
  const ordre = [1, 2, 3, 4, 5, 6, 0]
  return (
    <section id="infos" className="bg-creme py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-[1.1fr_1fr]">
        <div className="reveal rounded-[2rem] bg-cafe p-8 text-creme md:p-10">
          <Surtitre clair>Nous trouver</Surtitre>
          <h2 className="font-display text-4xl font-medium leading-tight">Au cœur de <em className="text-ocre">{r.ville}</em></h2>
          <div className="mt-8 space-y-5">
            <p className="flex gap-4"><Icone nom="pin" className="mt-0.5 h-6 w-6 shrink-0 text-ocre" /><span><span className="block font-semibold">{r.adresse}</span>{r.repere && <span className="text-creme/60">{r.repere}</span>}</span></p>
            {r.telephone && <p className="flex gap-4"><Icone nom="tel" className="h-6 w-6 shrink-0 text-ocre" /><a href={`tel:${r.telephone.replace(/\s/g, '')}`} className="font-semibold hover:text-ocre">{r.telephone}</a></p>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {r.maps_url && <a href={r.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ocre px-6 py-3 font-semibold text-cafe transition hover:bg-[#e6b354]"><Icone nom="pin" /> Itinéraire</a>}
            <a href={lienWhatsApp(r.whatsapp, messageQuestion(r.tag_whatsapp, r.nom))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold ring-1 ring-creme/30 transition hover:bg-white/10"><IconeWhatsApp /> Nous écrire</a>
          </div>
          {r.paiement.length > 0 && (
            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="text-sm text-creme/60">Moyens de paiement acceptés</p>
              <div className="mt-3 flex flex-wrap gap-2">{r.paiement.map(m => <span key={m.moyen} className="rounded-full bg-white/10 px-4 py-1.5 text-sm">{m.moyen}</span>)}</div>
            </div>
          )}
        </div>
        <div className="reveal rounded-[2rem] bg-white p-8 shadow-[0_2px_30px_-10px_rgba(33,21,13,.2)] md:p-10">
          <h3 className="flex items-center gap-3 font-display text-2xl text-cafe"><Icone nom="horloge" className="h-6 w-6 text-terre" /> Horaires</h3>
          <ul className="mt-6 divide-y divide-cafe/8">
            {ordre.map(j => {
              const h = r.horaires[String(j)]
              const estAuj = j === auj
              return (
                <li key={j} className={`flex justify-between py-3.5 ${estAuj ? 'font-semibold text-terre' : 'text-cafe'}`}>
                  <span>{JOURS[j]}{estAuj && <span className="ml-2 rounded-full bg-terre/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">Aujourd'hui</span>}</span>
                  <span className="tabular-nums">{h ? `${hFr(h[0])} – ${hFr(h[1])}` : 'Fermé'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

function PiedDePage({ r }: { r: Restaurant }) {
  return (
    <footer className="bg-cafe py-12 text-creme/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 text-sm md:flex-row">
        <Logo clair />
        <p className="text-center">© {new Date().getFullYear()} {r.nom} · {r.ville}</p>
        <a href="/admin" className="text-creme/40 transition hover:text-ocre">Espace gérant</a>
      </div>
    </footer>
  )
}

function BarreMobile({ r, nbArticles }: { r: Restaurant; nbArticles: number }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 overflow-hidden rounded-2xl bg-cafe/95 text-[11px] font-semibold text-creme shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl md:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <a href="#menu-du-jour" className="flex flex-col items-center gap-1 py-3"><Icone nom="carte" className="h-5 w-5 text-ocre" />Menu du jour</a>
      <a href="#reserver" className="relative flex flex-col items-center gap-1 bg-terre py-3">
        <Icone nom="calendrier" className="h-5 w-5" />Réserver
        {nbArticles > 0 && <span key={nbArticles} className="pop absolute right-[22%] top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ocre px-1 text-[10px] text-cafe">{nbArticles}</span>}
      </a>
      <a href={lienWhatsApp(r.whatsapp, messageQuestion(r.tag_whatsapp, r.nom))} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-3"><IconeWhatsApp className="h-5 w-5 text-[#4ade80]" />WhatsApp</a>
    </nav>
  )
}
