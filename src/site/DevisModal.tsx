import { useEffect, useState } from 'react'
import type { Restaurant, Service } from '../lib/types'
import { dateLongue, lienWhatsApp } from '../lib/utils'
import { IconeWhatsApp } from './ui'

export function DevisModal({ r, service, services, onFermer }: { r: Restaurant; service: Service; services: Service[]; onFermer: () => void }) {
  const [type, setType] = useState(service.titre)
  const [date, setDate] = useState('')
  const [invites, setInvites] = useState('')
  const [nom, setNom] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', f)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', f); document.body.style.overflow = '' }
  }, [onFermer])

  function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const msg = [
      `${r.tag_whatsapp} DEVIS – ${r.nom}`,
      ``,
      `Service : ${type}`,
      date ? `Date : ${dateLongue(date)}` : `Date : à préciser`,
      invites ? `Nombre d'invités : ${invites}` : '',
      details ? `Détails : ${details}` : '',
      `Nom : ${nom}`,
      ``,
      `Merci de m'envoyer un devis.`,
    ].filter(l => l !== '').join('\n').replace('\n\n\n', '\n\n')
    window.location.href = lienWhatsApp(r.whatsapp, msg)
  }

  const champ = 'w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-cafe ring-1 ring-cafe/10 focus:outline-none focus:ring-2 focus:ring-ocre'
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cafe/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onFermer} role="dialog" aria-modal="true" aria-label="Demande de devis">
      <form onSubmit={envoyer} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-creme p-7 shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terre">Devis gratuit</p>
            <h3 className="mt-1 font-display text-3xl text-cafe">Parlez-nous de votre événement</h3>
          </div>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl text-cafe">×</button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-cafe">Type de prestation</span>
            <select value={type} onChange={e => setType(e.target.value)} className={champ}>
              {services.map(s => <option key={s.id}>{s.titre}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-cafe">Date</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={champ} /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-cafe">Invités</span>
              <input type="number" min={1} inputMode="numeric" value={invites} onChange={e => setInvites(e.target.value)} placeholder="Ex. : 120" className={champ} /></label>
          </div>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-cafe">Votre nom</span>
            <input value={nom} onChange={e => setNom(e.target.value)} required className={champ} /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-cafe">Précisions <span className="font-normal text-gris">(lieu, plats souhaités…)</span></span>
            <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} maxLength={400} className={champ} /></label>
        </div>
        <button className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] py-4 font-semibold text-cafe"><IconeWhatsApp /> Envoyer sur WhatsApp</button>
      </form>
    </div>
  )
}
