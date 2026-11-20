import type { ReactNode } from 'react'

export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
        <circle cx="32" cy="32" r="31" fill={clair ? '#f7efe2' : '#21150d'} />
        <circle cx="32" cy="32" r="26" fill="none" stroke="#d9a441" strokeWidth="1.5" />
        <text x="32" y="41.5" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="27" fontStyle="italic" fill={clair ? '#21150d' : '#f7efe2'}>S</text>
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-[1.15rem] font-semibold tracking-tight ${clair ? 'text-creme' : 'text-cafe'}`}>Saveurs de l'Ouest</span>
        <span className={`block text-[0.62rem] font-semibold uppercase tracking-[0.28em] ${clair ? 'text-ocre' : 'text-ocre-fonce'}`}>Restaurant · Bafoussam</span>
      </span>
    </span>
  )
}

export function Stepper({ valeur, onMoins, onPlus, sombre = false, petit = false }: { valeur: number; onMoins: () => void; onPlus: () => void; sombre?: boolean; petit?: boolean }) {
  const t = petit ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg'
  const base = sombre ? 'bg-cafe text-creme hover:bg-cafe-2' : 'bg-creme-2 text-cafe hover:bg-ocre/30'
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/60 p-1 ring-1 ring-cafe/10">
      <button type="button" onClick={onMoins} aria-label="Retirer un" className={`${t} ${base} grid place-items-center rounded-full font-semibold transition`}>−</button>
      <span key={valeur} className="pop min-w-7 text-center font-semibold tabular-nums">{valeur}</span>
      <button type="button" onClick={onPlus} aria-label="Ajouter un" className={`${t} ${base} grid place-items-center rounded-full font-semibold transition`}>+</button>
    </div>
  )
}

export function Surtitre({ children, clair = false }: { children: ReactNode; clair?: boolean }) {
  return (
    <p className={`mb-3 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] ${clair ? 'text-ocre' : 'text-terre'}`}>
      <span className={`h-px w-8 ${clair ? 'bg-ocre' : 'bg-terre'}`} />
      {children}
    </p>
  )
}

export function IconeWhatsApp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.04.7C5.77.7.67 5.8.67 12.06c0 2 .52 3.96 1.52 5.68L.57 23.3l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04z" />
    </svg>
  )
}

export function Icone({ nom, className = 'h-5 w-5' }: { nom: 'horloge' | 'pin' | 'tel' | 'menu' | 'calendrier' | 'check' | 'etoile' | 'fleche' | 'carte' | 'feu'; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {nom === 'horloge' && <g {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>}
      {nom === 'pin' && <g {...p}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></g>}
      {nom === 'tel' && <g {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></g>}
      {nom === 'menu' && <g {...p}><path d="M4 6h16M4 12h16M4 18h10" /></g>}
      {nom === 'calendrier' && <g {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></g>}
      {nom === 'check' && <g {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></g>}
      {nom === 'etoile' && <path fill="currentColor" d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />}
      {nom === 'fleche' && <g {...p}><path d="M5 12h14M13 6l6 6-6 6" /></g>}
      {nom === 'carte' && <g {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 9h6M9 13h6" /></g>}
      {nom === 'feu' && <path fill="currentColor" d="M12.8 2.5c.4 3-1.5 4.6-3 6.2C8.4 10.3 7 12 7 14.6A5.2 5.2 0 0 0 12.2 20a5.6 5.6 0 0 0 5.8-5.6c0-3.3-2-5-3-6.6-.6 1.4-1.4 2.3-2.4 2.8.6-2.8.8-5.6.2-8.1z" />}
    </svg>
  )
}
