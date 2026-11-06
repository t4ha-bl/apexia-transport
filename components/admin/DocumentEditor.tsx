'use client';
import { useEffect, useState } from 'react';
import { addDocument, updateDocument } from '@/lib/firebaseUtils';
import { BillingDoc, DocType, DocLine, totals, money, reserveNumber, STATUS_LABELS } from '@/lib/billing';
import { Modal, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from './ui';
import { X } from '@phosphor-icons/react';

type Draft = Omit<BillingDoc, 'id' | 'number'> & { id?: string; number?: string };

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function blankDraft(type: DocType, vatRate: number, partial: Partial<Draft> = {}): Draft {
  const date = todayISO();
  return {
    type, date, dueDate: plusDays(date, type === 'quote' ? 30 : 15),
    customer: { name: '' }, lines: [{ description: '', qty: 1, unitPrice: 0 }],
    vatRate, pricesIncludeVat: true, status: type === 'quote' ? 'draft' : 'unpaid', payments: [], notes: '',
    ...partial,
  };
}

export default function DocumentEditor({ draft, onClose, onSaved }: {
  draft: Draft | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const toast = useToast();
  const [d, setD] = useState<Draft | null>(draft);
  const [saving, setSaving] = useState(false);
  useEffect(() => setD(draft), [draft]);
  if (!d) return null;

  const isQuote = d.type === 'quote';
  const t = totals(d);
  const setCustomer = (k: keyof Draft['customer'], v: string) => setD({ ...d, customer: { ...d.customer, [k]: v } });
  const setLine = (i: number, patch: Partial<DocLine>) => setD({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const save = async () => {
    if (!d.customer.name.trim()) { toast('error', 'Le nom du client est obligatoire.'); return; }
    const lines = d.lines.filter(l => l.description.trim()).map(l => ({ description: l.description.trim(), qty: Number(l.qty) || 0, unitPrice: Number(l.unitPrice) || 0 }));
    if (!lines.length) { toast('error', 'Ajoutez au moins une ligne.'); return; }
    if (!(d.vatRate >= 0 && d.vatRate <= 100)) { toast('error', 'Taux de TVA invalide.'); return; }
    const clean: Record<string, unknown> = {
      type: d.type, date: d.date, dueDate: d.dueDate || '',
      customer: Object.fromEntries(Object.entries(d.customer).map(([k, v]) => [k, (v || '').trim()])),
      reservationId: d.reservationId || null, reservationRef: d.reservationRef || '',
      lines, vatRate: Number(d.vatRate), pricesIncludeVat: d.pricesIncludeVat,
      status: d.status, payments: d.payments || [], notes: (d.notes || '').trim(),
      ...(d.fromQuoteId ? { fromQuoteId: d.fromQuoteId } : {}),
    };
    setSaving(true);
    try {
      if (d.id) {
        await updateDocument('documents', d.id, clean);
        toast('success', 'Document mis à jour.');
        onSaved?.(d.id);
      } else {
        const number = await reserveNumber(d.type, Number(d.date.slice(0, 4)) || new Date().getFullYear());
        const created = await addDocument('documents', { ...clean, number });
        toast('success', `${isQuote ? 'Devis' : 'Facture'} ${number} créé(e).`);
        onSaved?.(created.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast('error', "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!d} onClose={onClose} title={d.id ? `${isQuote ? 'Devis' : 'Facture'} ${d.number}` : isQuote ? 'Nouveau devis' : 'Nouvelle facture'} maxWidth="max-w-[900px]">
      <div className="flex flex-col gap-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={d.date} onChange={e => setD({ ...d, date: e.target.value })} /></div>
          <div><label className={labelClass}>{isQuote ? 'Valable jusqu’au' : 'Échéance'}</label><input type="date" className={inputClass} value={d.dueDate || ''} onChange={e => setD({ ...d, dueDate: e.target.value })} /></div>
          <div><label className={labelClass}>TVA (%)</label><input type="number" min={0} max={100} step="0.5" className={inputClass} value={d.vatRate} onChange={e => setD({ ...d, vatRate: Number(e.target.value) })} /></div>
          {isQuote ? (
            <div>
              <label className={labelClass}>Statut</label>
              <select className={inputClass} value={d.status} onChange={e => setD({ ...d, status: e.target.value as Draft['status'] })}>
                {(['draft', 'sent', 'accepted', 'refused'] as const).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          ) : (
            <div><label className={labelClass}>Réservation liée</label><input className={inputClass} value={d.reservationRef || ''} placeholder="APEX-…" onChange={e => setD({ ...d, reservationRef: e.target.value })} /></div>
          )}
        </div>

        <section>
          <h4 className="font-display text-[20px] text-ghost mb-3">Client</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>Nom *</label><input className={inputClass} value={d.customer.name} onChange={e => setCustomer('name', e.target.value)} /></div>
            <div><label className={labelClass}>Société</label><input className={inputClass} value={d.customer.company || ''} onChange={e => setCustomer('company', e.target.value)} /></div>
            <div><label className={labelClass}>ICE (entreprise)</label><input className={inputClass} value={d.customer.ice || ''} onChange={e => setCustomer('ice', e.target.value)} /></div>
            <div className="md:col-span-3"><label className={labelClass}>Adresse</label><input className={inputClass} value={d.customer.address || ''} onChange={e => setCustomer('address', e.target.value)} /></div>
            <div><label className={labelClass}>Téléphone</label><input className={inputClass} value={d.customer.phone || ''} onChange={e => setCustomer('phone', e.target.value)} /></div>
            <div className="md:col-span-2"><label className={labelClass}>E-mail</label><input className={inputClass} value={d.customer.email || ''} onChange={e => setCustomer('email', e.target.value)} /></div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-[20px] text-ghost">Prestations</h4>
            <label className="flex items-center gap-2 font-sans text-[12px] text-muted cursor-pointer">
              <input type="checkbox" className="accent-white" checked={d.pricesIncludeVat} onChange={e => setD({ ...d, pricesIncludeVat: e.target.checked })} />
              Prix saisis TTC
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="hidden md:grid grid-cols-[1fr_80px_150px_130px_40px] gap-2 font-sans text-[12px] text-muted">
              <span>Description</span><span>Qté</span><span>Prix unit. {d.pricesIncludeVat ? 'TTC' : 'HT'}</span><span className="text-right">Montant</span><span />
            </div>
            {d.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px] md:grid-cols-[1fr_80px_150px_130px_40px] gap-2 items-center">
                <input className={`${inputClass} col-span-2 md:col-span-1`} placeholder="Transfert aéroport CMN → Casablanca, 12/11" value={l.description} onChange={e => setLine(i, { description: e.target.value })} />
                <input type="number" min={0} step="1" className={inputClass} value={l.qty} onChange={e => setLine(i, { qty: Number(e.target.value) })} />
                <input type="number" min={0} step="0.01" className={inputClass} value={l.unitPrice} onChange={e => setLine(i, { unitPrice: Number(e.target.value) })} />
                <span className="font-sans text-[13px] text-ghost text-right">{money((Number(l.qty) || 0) * (Number(l.unitPrice) || 0))}</span>
                <button type="button" onClick={() => setD({ ...d, lines: d.lines.filter((_, j) => j !== i) })} className="h-[46px] border border-white/10 text-muted hover:text-red-400 rounded-[2px] flex items-center justify-center" aria-label="Retirer"><X size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setD({ ...d, lines: [...d.lines, { description: '', qty: 1, unitPrice: 0 }] })}
            className="mt-3 font-sans text-[12px] px-2 py-1 border border-dashed border-white/20 text-muted hover:text-ghost hover:border-white/40 rounded-[2px]">
            + Ajouter une ligne
          </button>
          <div className="mt-5 ml-auto max-w-[320px] font-sans text-[14px] flex flex-col gap-1.5">
            <div className="flex justify-between text-muted"><span>Total HT</span><span>{money(t.ht)}</span></div>
            <div className="flex justify-between text-muted"><span>TVA {d.vatRate}%</span><span>{money(t.vat)}</span></div>
            <div className="flex justify-between text-ghost font-medium text-[16px] pt-1.5 border-t border-white/10"><span>Total TTC</span><span>{money(t.ttc)}</span></div>
          </div>
        </section>

        <div><label className={labelClass}>Notes (imprimées sur le document)</label><textarea className={`${inputClass} h-20 resize-y`} placeholder="Conditions particulières, acompte demandé…" value={d.notes || ''} onChange={e => setD({ ...d, notes: e.target.value })} /></div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={ghostBtn}>Annuler</button>
          <button onClick={save} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : d.id ? 'Enregistrer' : isQuote ? 'Créer le devis' : 'Créer la facture'}</button>
        </div>
      </div>
    </Modal>
  );
}
