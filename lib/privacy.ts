import { doc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { Reservation } from './store/types';
import { Customer } from './customers';
import { BillingDoc, totals } from './billing';
import { Job } from './jobs';
import { Review } from './reviewTemplates';
import { logActivity, maskTail } from './activity';

// Customer data tools for Morocco's law 09-08 (right of access, right to erasure,
// limited retention). Owner only (see lib/roles.ts and firestore.rules).

// Personal fields wiped from a booking. Date, service, vehicle, price and status stay,
// anonymously, so statistics and revenue remain correct.
const ANON_NAME = 'Client anonymisé';
function anonymizedFields(): Record<string, unknown> {
  return {
    fullName: ANON_NAME, phone: '', email: '', address: '', message: '', notes: '', signName: '',
    flightNumber: '', pickup: '—', destination: '—',
    jobToken: deleteField(), reviewToken: deleteField(), anonymizedAt: new Date().toISOString(),
  };
}

export const isAnonymized = (r: Reservation) => !!(r as any).anonymizedAt;

// Firestore batches hold at most 500 writes
async function commitInChunks(ops: ((b: ReturnType<typeof writeBatch>) => void)[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(op => op(batch));
    await batch.commit();
  }
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Right of access: everything held about one customer, as a JSON file ----
export function exportCustomer(c: Customer, invoices: BillingDoc[], reviews: Review[] = []) {
  // Their documents: linked to one of their bookings, or issued to their phone number
  const mine = invoices.filter(d =>
    (d.reservationId && c.bookings.some(r => r.id === d.reservationId)) ||
    (d.customer?.phone && d.customer.phone.replace(/\D/g, '').endsWith(c.key.slice(-9))));
  const data = {
    exportedAt: new Date().toISOString(),
    controller: 'Apexia Transport SARL',
    customer: { name: c.name, phone: c.phone, ...c.profile, id: undefined },
    bookings: c.bookings.map(r => ({
      ref: r.ref, date: r.date, time: r.time, status: r.status, service: r.service, vehicle: r.vehicle, email: r.email,
      pickup: r.pickup, destination: r.destination, address: r.address, passengers: r.passengers, luggage: r.luggage,
      flightNumber: r.flightNumber, message: r.message, price: r.price, createdAt: r.createdAt,
    })),
    reviews: reviews.filter(v => c.bookings.some(r => r.id === v.reservationId)).map(v => ({ ref: v.ref, rating: v.rating, comment: v.comment, sentAt: v.createdAt })),
    invoicesAndQuotes: mine.map(d => ({ number: d.number, type: d.type, date: d.date, totalTTC: totals({ lines: d.lines || [], vatRate: d.vatRate || 0, pricesIncludeVat: d.pricesIncludeVat ?? true }).ttc, status: d.status })),
  };
  download(`donnees-client-${maskTail(c.key).replace(/\W/g, '')}-${data.exportedAt.slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  logActivity('export', 'customers', c.key, undefined, `Export des données · client ${maskTail(c.key)}`);
}

// ---- Right to erasure: anonymise a customer's bookings, delete profile + driver links ----
export async function eraseCustomer(c: Customer, jobsByReservation: Map<string, Job>) {
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  c.bookings.forEach(r => {
    ops.push(b => b.update(doc(db, 'reservations', r.id), anonymizedFields()));
    const job = jobsByReservation.get(r.id);
    if (job) ops.push(b => b.delete(doc(db, 'jobs', job.id)));
    if (r.reviewToken) ops.push(b => b.delete(doc(db, 'reviews', r.reviewToken!)));
  });
  ops.push(b => b.delete(doc(db, 'customers', c.key)));
  await commitInChunks(ops);
  logActivity('bulk', 'customers', c.key, undefined, `Effacement des données · client ${maskTail(c.key)} · ${c.bookings.length} réservation(s)`);
  return c.bookings.length;
}

// ---- Retention: bookings whose trip is older than N months ----
export function retentionCandidates(all: Reservation[], months: number) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const limit = cutoff.toISOString().slice(0, 10);
  return all.filter(r => r.date && r.date < limit && !isAnonymized(r));
}

export async function anonymizeOld(list: Reservation[], months: number, jobsByReservation: Map<string, Job>) {
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  list.forEach(r => {
    ops.push(b => b.update(doc(db, 'reservations', r.id), anonymizedFields()));
    const job = jobsByReservation.get(r.id);
    if (job) ops.push(b => b.delete(doc(db, 'jobs', job.id)));
    // Ratings stay (anonymous) for statistics; the first name goes
    if (r.reviewToken) ops.push(b => b.update(doc(db, 'reviews', r.reviewToken!), { firstName: '' }));
  });
  await commitInChunks(ops);
  logActivity('bulk', 'reservations', 'retention', undefined, `Anonymisation des réservations de plus de ${months} mois · ${list.length} réservation(s)`);
  return list.length;
}
