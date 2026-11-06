'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { subscribeCollection, fetchDocument, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { BillingDoc, CompanyInfo, DEFAULT_COMPANY, DocType, Payment, PAYMENT_METHODS, STATUS_LABELS, totals, money, invoiceStatusFor } from '@/lib/billing';
import { Reservation } from '@/lib/store/types';
import { phoneKey } from '@/lib/customers';
import { PageHeader, Modal, ConfirmDialog, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import DocumentEditor, { blankDraft } from '@/components/admin/DocumentEditor';
import { useAdminData } from '@/components/admin/useAdminData';
import { Plus, FilePdf, PencilSimple, Money, ArrowsLeftRight, Trash, Prohibit } from '@phosphor-icons/react';

type Tab = 'all' | DocType;

const STATUS_STYLE: Record<string, string> = {
  draft: 'border-white/15 text-muted', sent: 'border-white/30 text-ghost', accepted: 'border-green-500/30 text-green-400',
  refused: 'border-red-500/30 text-red-400', unpaid: 'border-amber-400/40 text-amber-200', partial: 'border-amber-400/40 text-amber-200',
  paid: 'border-green-500/30 text-green-400', cancelled: 'border-white/10 text-muted line-through',
};
const fmtDay = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR') : '—');

export default function AdminDocuments() {
  const toast = useToast();
  const { reservations, services, customers } = useAdminData();
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [tab, setTab] = useState<Tab>('all');
  const [draft, setDraft] = useState<ReturnType<typeof blankDraft> | null>(null);
  const [payFor, setPayFor] = useState<BillingDoc | null>(null);
  const [payment, setPayment] = useState<Payment>({ date: '', amount: 0, method: PAYMENT_METHODS[0], note: '' });
  const [toDelete, setToDelete] = useState<BillingDoc | null>(null);

  useEffect(() => {
    const unsub = subscribeCollection('documents', rows => {
      // Skip incomplete records (never created by the app) so one bad row can't break the page
      const valid = (rows as BillingDoc[]).filter(d => typeof d.number === 'string' && typeof d.date === 'string' && Array.isArray(d.lines) && d.customer);
      setDocs(valid.sort((a, b) => `${b.date}${b.number}`.localeCompare(`${a.date}${a.number}`)));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); toast('error', 'Impossible de charger les documents.'); });
    fetchDocument('config', 'company').then(c => c && setCompany({ ...DEFAULT_COMPANY, ...(c as any) })).catch(console.error);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft pre-filled from a booking (+ the customer's CRM profile)
  const draftFromReservation = (r: Reservation, type: DocType) => {
    const profile = customers.find(c => c.key === phoneKey(r.phone))?.profile;
    const svc = services.find(s => s.id === r.service)?.title || r.service;
    return blankDraft(type, company.defaultVatRate, {
      reservationId: r.id, reservationRef: r.ref || r.id,
      customer: { name: r.fullName, phone: r.phone, address: r.address || '', company: profile?.company || '', email: profile?.email || r.email || '' },
      lines: [{ description: `${svc} · ${fmtDay(r.date)} ${r.time} · ${r.pickup} → ${r.destination}`, qty: 1, unitPrice: typeof r.price === 'number' ? r.price : 0 }],
    });
  };

  // Opened from a booking card: /admin/documents?from=<reservationId>&type=invoice|quote
  const handledQuery = useRef(false);
  useEffect(() => {
    if (handledQuery.current || !reservations.length) return;
    const q = new URLSearchParams(window.location.search);
    const from = q.get('from');
    if (!from) { handledQuery.current = true; return; }
    const r = reservations.find(x => x.id === from);
    if (r) {
      handledQuery.current = true;
      setDraft(draftFromReservation(r, q.get('type') === 'quote' ? 'quote' : 'invoice'));
      window.history.replaceState(null, '', '/admin/documents');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, customers, services, company]);

  const visible = docs.filter(d => tab === 'all' || d.type === tab);

  const summary = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const invoices = docs.filter(d => d.type === 'invoice' && d.status !== 'cancelled');
    return {
      invoicedThisMonth: invoices.filter(d => d.date.startsWith(month)).reduce((s, d) => s + totals(d).ttc, 0),
      outstanding: invoices.reduce((s, d) => s + Math.max(0, totals(d).due), 0),
      openQuotes: docs.filter(d => d.type === 'quote' && (d.status === 'draft' || d.status === 'sent')).length,
    };
  }, [docs]);

  const openPayment = (d: BillingDoc) => {
    setPayFor(d);
    setPayment({ date: new Date().toISOString().slice(0, 10), amount: Math.max(0, totals(d).due), method: PAYMENT_METHODS[0], note: '' });
  };

  const savePayment = async () => {
    if (!payFor) return;
    if (!(payment.amount > 0)) { toast('error', 'Montant invalide.'); return; }
    const payments = [...(payFor.payments || []), { ...payment, amount: Number(payment.amount), note: (payment.note || '').trim() }];
    const next = { ...payFor, payments };
    try {
      await updateDocument('documents', payFor.id, { payments, status: invoiceStatusFor(next) }, payFor.number);
      toast('success', 'Paiement enregistré.');
      setPayFor(null);
    } catch (err) { console.error(err); toast('error', "Échec de l'enregistrement du paiement."); }
  };

  const convertToInvoice = (q: BillingDoc) => {
    setDraft(blankDraft('invoice', q.vatRate, {
      customer: q.customer, lines: q.lines, pricesIncludeVat: q.pricesIncludeVat, notes: q.notes,
      reservationId: q.reservationId || null, reservationRef: q.reservationRef || '', fromQuoteId: q.id,
    }));
    if (q.status !== 'accepted') updateDocument('documents', q.id, { status: 'accepted' }, q.number).catch(console.error);
  };

  const cancelInvoice = async (d: BillingDoc) => {
    try { await updateDocument('documents', d.id, { status: 'cancelled' }, d.number); toast('success', `Facture ${d.number} annulée.`); }
    catch (err) { console.error(err); toast('error', "Échec de l'annulation."); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const d = toDelete; setToDelete(null);
    try { await removeDocument('documents', d.id, d.number); toast('success', 'Devis supprimé.'); }
    catch (err) { console.error(err); toast('error', 'Échec de la suppression.'); }
  };

  const segBtn = (active: boolean) => `px-4 py-2 font-sans text-[12px] border-r border-white/10 last:border-r-0 transition-colors ${active ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'}`;
  const actBtn = 'inline-flex items-center gap-1.5 border border-white/15 text-ghost font-sans text-[12px] px-3 py-1.5 rounded-[2px] hover:border-white/50 transition-colors';

  return (
    <div>
      <PageHeader
        eyebrow="Facturation"
        title="Devis & Factures"
        subtitle="Numérotation automatique, TVA, paiements et PDF prêts à envoyer."
        action={
          <div className="flex gap-2">
            <button onClick={() => setDraft(blankDraft('quote', company.defaultVatRate))} className={ghostBtn}><Plus size={14} weight="bold" /> Devis</button>
            <button onClick={() => setDraft(blankDraft('invoice', company.defaultVatRate))} className={primaryBtn}><Plus size={14} weight="bold" /> Facture</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[['Facturé ce mois (TTC)', money(summary.invoicedThisMonth)], ['Reste à encaisser', money(summary.outstanding)], ['Devis en cours', String(summary.openQuotes)]].map(([label, value]) => (
          <div key={label} className="p-5 bg-ink border border-white/10 rounded-[2px]">
            <div className="font-sans text-[12px] text-muted">{label}</div>
            <div className="font-display text-[30px] leading-none mt-3 text-ghost">{value}</div>
          </div>
        ))}
      </div>

      <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden mb-6">
        <button onClick={() => setTab('all')} className={segBtn(tab === 'all')}>Tout ({docs.length})</button>
        <button onClick={() => setTab('quote')} className={segBtn(tab === 'quote')}>Devis</button>
        <button onClick={() => setTab('invoice')} className={segBtn(tab === 'invoice')}>Factures</button>
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">
          Aucun document. Créez-en un ici ou depuis une réservation (bouton « Facturer »).
        </div>
      ) : (
        <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
          {visible.map(d => {
            const tt = totals(d);
            return (
              <div key={d.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-[1.2fr_0.8fr_1.6fr_1fr_1fr] gap-3 items-center">
                  <div>
                    <div className="font-sans text-[14px] text-ghost">{d.number}</div>
                    <div className="font-sans text-[12px] text-muted">{d.type === 'quote' ? 'Devis' : 'Facture'}{d.reservationRef ? ` · ${d.reservationRef}` : ''}</div>
                  </div>
                  <div className="font-sans text-[13px] text-muted">{fmtDay(d.date)}</div>
                  <div className="font-sans text-[13px] text-ghost truncate">{d.customer.company || d.customer.name}</div>
                  <div className="font-sans text-[13px] text-ghost">{money(tt.ttc)}{d.type === 'invoice' && tt.paid > 0 && tt.due > 0.01 ? <div className="text-[12px] text-amber-200">reste {money(tt.due)}</div> : null}</div>
                  <span className={`justify-self-start font-sans text-[12px] px-2 py-1 border rounded-[2px] ${STATUS_STYLE[d.status]}`}>{STATUS_LABELS[d.status]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/documents/${d.id}`} className={actBtn}><FilePdf size={15} /> PDF</Link>
                  {d.status !== 'cancelled' && <button onClick={() => setDraft({ ...d })} className={actBtn}><PencilSimple size={15} /></button>}
                  {d.type === 'invoice' && d.status !== 'cancelled' && d.status !== 'paid' && <button onClick={() => openPayment(d)} className={actBtn}><Money size={15} /> Paiement</button>}
                  {d.type === 'quote' && d.status !== 'refused' && <button onClick={() => convertToInvoice(d)} className={actBtn}><ArrowsLeftRight size={15} /> Facturer</button>}
                  {d.type === 'invoice' && d.status !== 'cancelled' && <button onClick={() => cancelInvoice(d)} className={actBtn} title="Annuler la facture (elle reste numérotée)"><Prohibit size={15} /></button>}
                  {d.type === 'quote' && <button onClick={() => setToDelete(d)} className="inline-flex items-center border border-red-500/25 text-red-400 px-3 py-1.5 rounded-[2px] hover:bg-red-500/10" aria-label="Supprimer"><Trash size={15} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DocumentEditor draft={draft} onClose={() => setDraft(null)} />

      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`Paiement · ${payFor?.number || ''}`} maxWidth="max-w-[520px]">
        {payFor && (
          <div className="flex flex-col gap-4">
            <div className="font-sans text-[13px] text-muted">Total {money(totals(payFor).ttc)} · déjà payé {money(totals(payFor).paid)} · reste <span className="text-ghost">{money(totals(payFor).due)}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} /></div>
              <div><label className={labelClass}>Montant (MAD)</label><input type="number" min={0} step="0.01" className={inputClass} value={payment.amount} onChange={e => setPayment({ ...payment, amount: Number(e.target.value) })} /></div>
              <div className="col-span-2">
                <label className={labelClass}>Mode de paiement</label>
                <select className={inputClass} value={payment.method} onChange={e => setPayment({ ...payment, method: e.target.value })}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className={labelClass}>Note</label><input className={inputClass} placeholder="Acompte, référence du virement…" value={payment.note} onChange={e => setPayment({ ...payment, note: e.target.value })} /></div>
            </div>
            {(payFor.payments || []).length > 0 && (
              <div className="border border-white/10 rounded-[2px] divide-y divide-white/5">
                {payFor.payments!.map((p, i) => <div key={i} className="px-3 py-2 font-sans text-[12px] text-muted flex justify-between"><span>{fmtDay(p.date)} · {p.method}{p.note ? ` · ${p.note}` : ''}</span><span className="text-ghost">{money(p.amount)}</span></div>)}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setPayFor(null)} className={ghostBtn}>Annuler</button>
              <button onClick={savePayment} className={primaryBtn}>Enregistrer</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} title="Supprimer le devis" message={`Supprimer le devis ${toDelete?.number || ''} ?`} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
