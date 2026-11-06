'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDocument } from '@/lib/firebaseUtils';
import { BillingDoc, CompanyInfo, DEFAULT_COMPANY, totals, money, amountInWords, STATUS_LABELS } from '@/lib/billing';
import { primaryBtn, ghostBtn } from '@/components/admin/ui';
import { ArrowLeft, Printer } from '@phosphor-icons/react';

const fmtDay = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR') : '');

// A4 quote / invoice. "Télécharger / Imprimer" opens the browser print dialog, where
// "Enregistrer au format PDF" produces the PDF file. The admin menu is hidden when printing.
export default function DocumentPrint({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<BillingDoc | null>(null);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    Promise.all([fetchDocument('documents', params.id), fetchDocument('config', 'company')])
      .then(([d, c]) => {
        if (!d) { setState('missing'); return; }
        setDoc(d as BillingDoc);
        if (c) setCompany({ ...DEFAULT_COMPANY, ...(c as any) });
        setState('ok');
      })
      .catch(() => setState('missing'));
  }, [params.id]);

  // Suggested PDF file name = the document number
  useEffect(() => {
    if (!doc) return;
    const prev = document.title;
    document.title = `${doc.number} - ${doc.customer.company || doc.customer.name}`;
    return () => { document.title = prev; };
  }, [doc]);

  if (state !== 'ok' || !doc) {
    return <div className="py-16 text-center font-sans text-[14px] text-muted">{state === 'loading' ? 'Chargement…' : 'Document introuvable.'}</div>;
  }

  const t = totals(doc);
  const isQuote = doc.type === 'quote';
  const legal = [company.rc && `RC : ${company.rc}`, company.if && `IF : ${company.if}`, company.ice && `ICE : ${company.ice}`, company.cnss && `CNSS : ${company.cnss}`, company.patente && `Patente : ${company.patente}`].filter(Boolean).join(' · ');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link href="/admin/documents" className={ghostBtn}><ArrowLeft size={14} /> Retour</Link>
        <div className="flex items-center gap-3">
          <span className="font-sans text-[12px] text-muted">Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF ».</span>
          <button onClick={() => window.print()} className={primaryBtn}><Printer size={15} /> Télécharger / Imprimer</button>
        </div>
      </div>

      {/* A4 sheet (scrolls sideways on small screens; prints at exact A4) */}
      <div className="overflow-x-auto print:overflow-visible">
      <div className="invoice-sheet mx-auto bg-[#ffffff] text-[#111] shadow-2xl print:shadow-none" style={{ width: '210mm', minHeight: '297mm', padding: '16mm 16mm 14mm' }}>
        <div className="flex justify-between items-start">
          <div>
            {/* The logo file is light; render it black on the white paper */}
            <img src="/images/apexia logo.png" alt="Apexia Transport" style={{ height: 34, filter: 'brightness(0)' }} className="object-contain" />
            <div className="mt-3 text-[11px] leading-relaxed text-[#444]">
              <div className="font-semibold text-[#111]">{company.legalName}</div>
              <div className="whitespace-pre-line">{company.address}</div>
              <div>{company.phone} · {company.email}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-semibold tracking-wide uppercase">{isQuote ? 'Devis' : 'Facture'}</div>
            <div className="text-[13px] mt-1">N° <span className="font-semibold">{doc.number}</span></div>
            <div className="text-[11px] text-[#555] mt-1">Date : {fmtDay(doc.date)}</div>
            {doc.dueDate && <div className="text-[11px] text-[#555]">{isQuote ? 'Valable jusqu’au' : 'Échéance'} : {fmtDay(doc.dueDate)}</div>}
            {doc.reservationRef && <div className="text-[11px] text-[#555]">Réservation : {doc.reservationRef}</div>}
            {doc.status === 'cancelled' && <div className="mt-2 inline-block border border-red-600 text-red-600 text-[11px] px-2 py-0.5 uppercase">{STATUS_LABELS.cancelled}</div>}
          </div>
        </div>

        <div className="mt-8 ml-auto w-[48%] border border-[#ddd] p-4 text-[12px] leading-relaxed">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#777] mb-1">{isQuote ? 'Destinataire' : 'Facturé à'}</div>
          {doc.customer.company && <div className="font-semibold">{doc.customer.company}</div>}
          <div className={doc.customer.company ? '' : 'font-semibold'}>{doc.customer.name}</div>
          {doc.customer.address && <div>{doc.customer.address}</div>}
          {doc.customer.phone && <div>{doc.customer.phone}</div>}
          {doc.customer.email && <div>{doc.customer.email}</div>}
          {doc.customer.ice && <div>ICE : {doc.customer.ice}</div>}
        </div>

        <table className="w-full mt-8 text-[12px] border-collapse">
          <thead>
            <tr className="bg-[#111] text-[#ffffff]">
              <th className="text-left font-medium px-3 py-2">Désignation</th>
              <th className="text-right font-medium px-3 py-2 w-[60px]">Qté</th>
              <th className="text-right font-medium px-3 py-2 w-[130px]">P.U. {doc.pricesIncludeVat ? 'TTC' : 'HT'}</th>
              <th className="text-right font-medium px-3 py-2 w-[130px]">Montant {doc.pricesIncludeVat ? 'TTC' : 'HT'}</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-b border-[#e5e5e5]">
                <td className="px-3 py-2.5 align-top">{l.description}</td>
                <td className="px-3 py-2.5 text-right align-top">{l.qty}</td>
                <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">{money(l.unitPrice)}</td>
                <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">{money(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-[48%] text-[12px]">
          <div className="flex justify-between py-1"><span>Total HT</span><span>{money(t.ht)}</span></div>
          <div className="flex justify-between py-1"><span>TVA {doc.vatRate}%</span><span>{money(t.vat)}</span></div>
          <div className="flex justify-between py-2 mt-1 border-t-2 border-[#111] text-[14px] font-semibold"><span>Total TTC</span><span>{money(t.ttc)}</span></div>
          {!isQuote && t.paid > 0 && (
            <>
              <div className="flex justify-between py-1 text-[#555]"><span>Déjà réglé</span><span>{money(t.paid)}</span></div>
              <div className="flex justify-between py-1 font-semibold"><span>Reste à payer</span><span>{money(Math.max(0, t.due))}</span></div>
            </>
          )}
        </div>

        <p className="mt-6 text-[11.5px]">
          {isQuote ? 'Arrêté le présent devis' : 'Arrêtée la présente facture'} à la somme de : <span className="font-semibold capitalize-first">{amountInWords(t.ttc)}</span> TTC.
        </p>

        {doc.notes && <div className="mt-5 text-[11.5px] whitespace-pre-wrap border-l-2 border-[#111] pl-3">{doc.notes}</div>}

        <div className="mt-6 text-[11px] text-[#444] leading-relaxed">
          {!isQuote && company.paymentTerms && <div>{company.paymentTerms}</div>}
          {(company.bank || company.rib) && <div>Règlement par virement : {company.bank}{company.rib ? ` · RIB ${company.rib}` : ''}</div>}
          {isQuote && <div className="mt-4">Bon pour accord (date, signature et cachet) :</div>}
        </div>

        <div className="mt-10 pt-3 border-t border-[#ddd] text-center text-[9.5px] text-[#777] leading-relaxed">
          <div>{company.legalName}{legal ? ` · ${legal}` : ''}</div>
          {company.footer && <div>{company.footer}</div>}
        </div>
      </div>
      </div>
    </div>
  );
}
