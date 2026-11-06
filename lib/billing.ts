import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export type DocType = 'quote' | 'invoice';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'refused';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface DocLine { description: string; qty: number; unitPrice: number }
export interface Payment { date: string; amount: number; method: string; note?: string }

export interface BillingDoc {
  id: string;
  type: DocType;
  number: string;              // DEV-2026-0001 / FAC-2026-0001
  date: string;                // YYYY-MM-DD
  dueDate?: string;            // invoice: due date / quote: valid until
  customer: { name: string; company?: string; ice?: string; address?: string; phone?: string; email?: string };
  reservationId?: string | null;
  reservationRef?: string;
  lines: DocLine[];
  vatRate: number;             // %
  pricesIncludeVat: boolean;   // unit prices typed TTC (true) or HT (false)
  status: QuoteStatus | InvoiceStatus;
  payments?: Payment[];
  notes?: string;
  fromQuoteId?: string;        // invoice created from this quote
  createdAt?: string;
}

// Company details printed on documents (admin-only `config/company`)
export interface CompanyInfo {
  legalName: string; address: string; phone: string; email: string;
  ice: string; if: string; rc: string; cnss: string; patente: string;
  bank: string; rib: string;
  defaultVatRate: number;
  paymentTerms: string;
  footer: string;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  legalName: 'Apexia Transport SARL',
  address: 'Rue Jbel Moussa, Imm 22, Agdal, Rabat',
  phone: '+212 5 20 72 18 33',
  email: 'contact@apexiatransport.com',
  ice: '003293631000011', if: '53796636', rc: '168793', cnss: '4834101', patente: '',
  bank: '', rib: '',
  defaultVatRate: 20,
  paymentTerms: 'Paiement à réception de facture.',
  footer: '',
};

export const PAYMENT_METHODS = ['Espèces', 'Virement', 'Carte bancaire', 'Chèque', 'Lien de paiement'];

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function totals(d: Pick<BillingDoc, 'lines' | 'vatRate' | 'pricesIncludeVat' | 'payments'>) {
  const gross = d.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const rate = (Number(d.vatRate) || 0) / 100;
  const ht = d.pricesIncludeVat ? gross / (1 + rate) : gross;
  const ttc = d.pricesIncludeVat ? gross : gross * (1 + rate);
  const paid = (d.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return { ht: round2(ht), vat: round2(ttc - ht), ttc: round2(ttc), paid: round2(paid), due: round2(ttc - paid) };
}

// Invoice status follows the payments (cancelled stays cancelled)
export function invoiceStatusFor(d: BillingDoc): InvoiceStatus {
  if (d.status === 'cancelled') return 'cancelled';
  const t = totals(d);
  if (t.paid <= 0) return 'unpaid';
  return t.paid + 0.01 >= t.ttc ? 'paid' : 'partial';
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé',
  unpaid: 'Non payée', partial: 'Partiellement payée', paid: 'Payée', cancelled: 'Annulée',
};

export const money = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

// Next sequential number for a type and year, reserved atomically (no duplicates even
// if two people create a document at the same time)
export async function reserveNumber(type: DocType, year: number): Promise<string> {
  const prefix = type === 'quote' ? 'DEV' : 'FAC';
  const counterRef = doc(db, 'counters', `${type}-${year}`);
  const next = await runTransaction(db, async tx => {
    const snap = await tx.get(counterRef);
    const value = (snap.exists() ? (snap.data().value as number) : 0) + 1;
    tx.set(counterRef, { value });
    return value;
  });
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}

// ---- Amount in French words ("mille deux cent cinquante dirhams et 50 centimes") ----
const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    return TENS[t] + (u === 1 ? '-et-un' : u ? `-${UNITS[u]}` : '');
  }
  if (n < 80) return n === 71 ? 'soixante-et-onze' : `soixante-${UNITS[n - 60]}`;
  const u = n - 80;
  return u === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[u]}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  if (h === 0) return below100(r);
  const head = h === 1 ? 'cent' : `${UNITS[h]} cent${r === 0 ? 's' : ''}`;
  return r ? `${head} ${below100(r)}` : head;
}

export function numberToFrench(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zéro';
  const parts: string[] = [];
  const millions = Math.floor(n / 1e6), thousands = Math.floor((n % 1e6) / 1000), rest = n % 1000;
  if (millions) parts.push(`${below1000(millions)} million${millions > 1 ? 's' : ''}`);
  // "cents"/"quatre-vingts" lose their s before "mille"
  if (thousands) parts.push(thousands === 1 ? 'mille' : `${below1000(thousands).replace(/(cent|vingt)s$/, '$1')} mille`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

export function amountInWords(amount: number): string {
  const dirhams = Math.floor(amount + 1e-9);
  const centimes = Math.round((amount - dirhams) * 100);
  // "un million de dirhams" (round millions take "de")
  const de = dirhams >= 1e6 && dirhams % 1e6 === 0 ? 'de ' : '';
  const words = `${numberToFrench(dirhams)} ${de}dirham${dirhams > 1 ? 's' : ''}`;
  return centimes ? `${words} et ${numberToFrench(centimes)} centime${centimes > 1 ? 's' : ''}` : words;
}
