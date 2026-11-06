'use client';
import { useEffect, useMemo, useState } from 'react';
import { subscribeActivity } from '@/lib/firebaseUtils';
import { ActivityEntry } from '@/lib/activity';
import { PageHeader, useToast, inputClass } from '@/components/admin/ui';
import { MagnifyingGlass } from '@phosphor-icons/react';

const MAX = 300;

const COLLECTION_LABELS: Record<string, string> = {
  reservations: 'Réservation', drivers: 'Chauffeur', fleet: 'Véhicule', customers: 'Client',
  documents: 'Devis / facture', jobs: 'Lien chauffeur', services: 'Service', vehicles: 'Modèle (catalogue)',
  partners: 'Partenaire', settings: 'Paramètres du site', config: 'Société', admins: 'Équipe', reviews: 'Avis',
};
const ACTION_LABELS: Record<string, string> = {
  create: 'a créé', update: 'a modifié', delete: 'a supprimé', bulk: 'opération groupée', export: 'a exporté',
};
const ACTION_STYLE: Record<string, string> = {
  create: 'text-green-400', update: 'text-ghost', delete: 'text-red-400', bulk: 'text-amber-200', export: 'text-amber-200',
};

export default function AdminActivity() {
  const toast = useToast();
  const [rows, setRows] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [who, setWho] = useState('');
  const [what, setWhat] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => subscribeActivity(MAX, r => { setRows(r as ActivityEntry[]); setLoading(false); },
    err => { console.error(err); setLoading(false); toast('error', 'Impossible de charger le journal.'); }), // eslint-disable-line react-hooks/exhaustive-deps
  []);

  const people = useMemo(() => Array.from(new Set(rows.map(r => r.actorEmail))).sort(), [rows]);
  const kinds = useMemo(() => Array.from(new Set(rows.map(r => r.collection))).sort(), [rows]);
  const visible = rows.filter(r =>
    (!who || r.actorEmail === who) && (!what || r.collection === what) &&
    (!search.trim() || [r.label, r.docId, ...(r.changes || [])].some(v => (v || '').toLowerCase().includes(search.trim().toLowerCase()))));

  const sel = 'bg-offblack border border-white/10 px-3 py-2.5 font-sans text-[13px] text-ghost rounded-[2px] outline-none focus:border-white/40';

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Journal d'activité"
        subtitle={`Qui a fait quoi, et quand. Les entrées ne peuvent être ni modifiées ni supprimées. ${MAX} dernières actions.`} />

      <div className="flex flex-wrap gap-3 mb-6">
        <select className={sel} value={who} onChange={e => setWho(e.target.value)}>
          <option value="">Toute l&apos;équipe</option>
          {people.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={sel} value={what} onChange={e => setWhat(e.target.value)}>
          <option value="">Tous les éléments</option>
          {kinds.map(k => <option key={k} value={k}>{COLLECTION_LABELS[k] || k}</option>)}
        </select>
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={`${inputClass} pl-9 !py-2.5`} placeholder="Référence, numéro, champ…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">Aucune activité.</div>
      ) : (
        <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
          {visible.map(r => {
            const when = r.at ? r.at.toDate() : null;
            return (
              <div key={r.id}>
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full text-left px-5 py-3 grid grid-cols-1 md:grid-cols-[150px_1.4fr_2fr] gap-1 md:gap-4 hover:bg-white/[0.03]">
                  <span className="font-sans text-[12px] text-muted tabular-nums">{when ? when.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '…'}</span>
                  <span className="font-sans text-[13px] text-ghost truncate">{r.actorEmail}</span>
                  <span className="font-sans text-[13px] truncate">
                    <span className={ACTION_STYLE[r.action] || 'text-ghost'}>{ACTION_LABELS[r.action] || r.action}</span>{' '}
                    <span className="text-muted">{COLLECTION_LABELS[r.collection] || r.collection}</span>{' '}
                    <span className="text-ghost">{r.label}</span>
                  </span>
                </button>
                {open === r.id && r.changes && r.changes.length > 0 && (
                  <ul className="px-5 pb-4 md:pl-[190px] font-sans text-[12px] text-muted flex flex-col gap-0.5">
                    {r.changes.map((c, i) => <li key={i}>· {c}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
