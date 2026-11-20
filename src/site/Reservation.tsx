import { useEffect, useMemo, useState } from 'react'
import { supabase, RESTAURANT_SLUG } from '../lib/supabase'
import type { LigneReservation, Plat, Restaurant } from '../lib/types'
import { ajouterJours, creneaux, dateLongue, fcfa, hFr, lienWhatsApp, maintenantDouala, miniature } from '../lib/utils'
import { Icone, IconeWhatsApp, Stepper, Surtitre } from './ui'

const ERREURS: Record<string, string> = {
  PLAT_INDISPONIBLE: 'Un des plats choisis n\'est plus disponible. Retirez-le puis réessayez.',
  NOM_INVALIDE: 'Indiquez votre nom (2 caractères minimum).',
  TELEPHONE_INVALIDE: 'Indiquez un numéro de téléphone valide.',
  DATE_INVALIDE: 'Choisissez une date à venir.',
  HEURE_INVALIDE: 'Choisissez une heure.',
  TROP_DE_DEMANDES: 'Vous avez déjà envoyé plusieurs demandes. Patientez quelques minutes.',
}

type Props = { r: Restaurant; plats: Plat[]; panier: Record<string, number>; changer: (id: string, d: number) => void; vider: () => void }

export function Reservation({ r, plats, panier, changer, vider }: Props) {
  const auj = maintenantDouala().iso
  const [date, setDate] = useState(auj)
  const options = useMemo(() => creneaux(r.horaires, date), [r.horaires, date])
  const [heure, setHeure] = useState('')
  const [personnes, setPersonnes] = useState(2)
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [note, setNote] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<{ ref: string; url: string } | null>(null)

  useEffect(() => { if (!options.includes(heure)) setHeure(options[0] ?? '') }, [options, heure])

  const lignes = plats.filter(p => panier[p.id]).map(p => ({ p, q: panier[p.id] }))
  const total = lignes.reduce((s, l) => s + l.p.prix * l.q, 0)
  const jours = [0, 1, 2, 3, 4, 5, 6].map(i => ajouterJours(auj, i))

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (!heure) { setErreur('Aucun créneau disponible ce jour-là. Choisissez une autre date.'); return }
    if (nom.trim().length < 2) { setErreur(ERREURS.NOM_INVALIDE); return }
    if (!/^[0-9 +]{8,20}$/.test(tel.trim())) { setErreur(ERREURS.TELEPHONE_INVALIDE); return }
    setEnvoi(true)
    const { data, error } = await supabase.rpc('resto_creer_reservation', {
      p_slug: RESTAURANT_SLUG, p_nom: nom.trim(), p_telephone: tel.trim(), p_date: date, p_heure: heure,
      p_personnes: personnes, p_plats: lignes.map(l => ({ plat_id: l.p.id, quantite: l.q })), p_note: note.trim() || null,
    })
    setEnvoi(false)
    if (error || !data) {
      const code = Object.keys(ERREURS).find(k => error?.message?.includes(k))
      setErreur(code ? ERREURS[code] : 'La connexion a échoué. Vérifiez votre réseau et réessayez.')
      return
    }
    const res = data as { reference: string; plats: LigneReservation[]; total: number }
    const quand = date === auj ? `aujourd'hui (${dateLongue(date)})` : dateLongue(date)
    const msg = [
      `${r.tag_whatsapp} RÉSERVATION ${res.reference} – ${r.nom}`,
      ``,
      `📅 ${quand[0].toUpperCase() + quand.slice(1)} à ${hFr(heure)}`,
      `👥 ${personnes} personne${personnes > 1 ? 's' : ''}`,
      ...(res.plats.length ? [``, `🍽️ Pré-commande :`, ...res.plats.map(l => `• ${l.quantite}× ${l.nom} (${fcfa(l.prix)})`), `Total pré-commande : ${fcfa(res.total)}`] : [``, `Table seulement (sans pré-commande)`]),
      ``,
      `Nom : ${nom.trim()}`,
      `Tél : ${tel.trim()}`,
      ...(note.trim() ? [`Note : ${note.trim()}`] : []),
      ``,
      `Merci de confirmer ma réservation.`,
    ].join('\n')
    const url = lienWhatsApp(r.whatsapp, msg)
    setSucces({ ref: res.reference, url })
    vider()
    window.location.href = url
  }

  const champ = 'w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-cafe ring-1 ring-cafe/10 placeholder:text-cafe/35 focus:outline-none focus:ring-2 focus:ring-ocre'

  return (
    <section id="reserver" className="relative bg-papier py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mb-12 max-w-2xl">
          <Surtitre>Réservation</Surtitre>
          <h2 className="font-display text-4xl font-medium tracking-tight text-cafe md:text-6xl">Réservez en <em className="text-terre">une minute.</em></h2>
          <p className="mt-4 text-gris">Votre demande arrive directement sur notre WhatsApp. Nous confirmons votre table et, si vous avez pré-commandé, nous vous indiquons comment régler par Mobile Money.</p>
        </div>

        {succes ? (
          <div className="reveal is-in mx-auto max-w-xl rounded-[2rem] bg-cafe p-10 text-center text-creme">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-feuille"><Icone nom="check" className="h-8 w-8" /></span>
            <h3 className="mt-6 font-display text-3xl">Demande {succes.ref} prête !</h3>
            <p className="mt-3 text-creme/70">Envoyez le message sur WhatsApp pour que nous confirmions votre réservation.</p>
            <a href={succes.url} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-4 font-semibold text-cafe"><IconeWhatsApp /> Ouvrir WhatsApp</a>
            <button onClick={() => setSucces(null)} className="mt-4 block w-full text-sm text-creme/50 hover:text-creme">Faire une autre réservation</button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="reveal min-w-0 space-y-7 rounded-[2rem] bg-creme p-6 md:p-9">
              <fieldset className="min-w-0">
                <legend className="mb-3 text-sm font-semibold text-cafe">Quel jour ?</legend>
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {jours.map((j, i) => {
                    const [y, m, d] = j.split('-').map(Number)
                    const dt = new Date(Date.UTC(y, m - 1, d))
                    const ferme = !r.horaires[String(dt.getUTCDay())]
                    const actif = j === date
                    return (
                      <button type="button" key={j} disabled={ferme} onClick={() => setDate(j)}
                        className={`flex w-[4.4rem] shrink-0 flex-col items-center rounded-2xl py-3 transition ${actif ? 'bg-cafe text-creme shadow-lg' : 'bg-white text-cafe ring-1 ring-cafe/10 hover:ring-ocre'} disabled:opacity-35`}>
                        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' }).format(dt).replace('.', '')}</span>
                        <span className="font-display text-2xl">{d}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-3 block text-sm font-semibold text-cafe">À quelle heure ?</span>
                  <select value={heure} onChange={e => setHeure(e.target.value)} className={champ}>
                    {options.length === 0 && <option value="">Plus de créneau ce jour</option>}
                    {options.map(o => <option key={o} value={o}>{hFr(o)}</option>)}
                  </select>
                </label>
                <div>
                  <span className="mb-3 block text-sm font-semibold text-cafe">Combien de personnes ?</span>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-1.5 ring-1 ring-cafe/10">
                    <span className="pl-1 text-cafe">{personnes} pers.</span>
                    <Stepper petit valeur={personnes} onMoins={() => setPersonnes(p => Math.max(1, p - 1))} onPlus={() => setPersonnes(p => Math.min(200, p + 1))} />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block"><span className="mb-3 block text-sm font-semibold text-cafe">Votre nom</span>
                  <input value={nom} onChange={e => setNom(e.target.value)} autoComplete="name" placeholder="Ex. : Mireille Kamga" className={champ} required /></label>
                <label className="block"><span className="mb-3 block text-sm font-semibold text-cafe">Votre téléphone</span>
                  <input value={tel} onChange={e => setTel(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="6XX XX XX XX" className={champ} required /></label>
              </div>
              <label className="block"><span className="mb-3 block text-sm font-semibold text-cafe">Une précision ? <span className="font-normal text-gris">(facultatif)</span></span>
                <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="Anniversaire, terrasse, piment à part…" className={champ} /></label>
            </div>

            <aside className="reveal flex min-w-0 flex-col rounded-[2rem] bg-cafe p-6 text-creme md:p-9 lg:sticky lg:top-24 lg:self-start">
              <h3 className="font-display text-2xl">Ma pré-commande</h3>
              <p className="mt-1 text-sm text-creme/55">Facultatif : vos plats seront prêts à votre arrivée.</p>
              {lignes.length === 0 ? (
                <div className="my-6 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-creme/60">
                  Aucun plat pour l'instant.<br />
                  <a href="#menu-du-jour" className="mt-2 inline-block font-semibold text-ocre">Choisir dans le menu du jour →</a>
                </div>
              ) : (
                <ul className="my-6 space-y-4">
                  {lignes.map(({ p, q }) => (
                    <li key={p.id} className="flex items-center gap-3">
                      {p.photo_url ? <img src={miniature(p.photo_url) ?? ''} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className="ndop h-12 w-12 rounded-xl bg-cafe-2" />}
                      <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.nom}</p><p className="text-sm text-creme/55">{fcfa(p.prix * q)}</p></div>
                      <div className="text-cafe"><Stepper petit valeur={q} onMoins={() => changer(p.id, -1)} onPlus={() => changer(p.id, 1)} /></div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
                <div className="flex justify-between text-creme/70"><span>{dateLongue(date)}</span><span>{heure ? hFr(heure) : '—'}</span></div>
                <div className="flex items-end justify-between"><span className="text-creme/70">Total pré-commande</span><span className="font-display text-3xl text-ocre">{fcfa(total)}</span></div>
              </div>
              {erreur && <p role="alert" className="mt-5 rounded-xl bg-terre/20 px-4 py-3 text-sm text-[#ffcdb8]">{erreur}</p>}
              <button disabled={envoi} className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] py-4 font-semibold text-cafe shadow-lg shadow-black/20 transition hover:brightness-105 disabled:opacity-60">
                {envoi ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-cafe/30 border-t-cafe" /> : <IconeWhatsApp />}
                {envoi ? 'Préparation…' : 'Réserver sur WhatsApp'}
              </button>
              <p className="mt-3 text-center text-xs text-creme/45">Aucun paiement sur le site. Tout se confirme sur WhatsApp.</p>
            </aside>
          </form>
        )}
      </div>
    </section>
  )
}
