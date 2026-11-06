import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Reservation, Service, Vehicle } from './store/types';
import { Driver, FleetUnit } from './fleet';
import { bookingInterval } from './bookings';
import { logActivity } from './activity';

// A job is the driver-facing copy of a booking, stored at `jobs/{token}`. Anyone holding
// the secret token can read that one job and update only its status (see firestore.rules).
// It deliberately contains no price and no internal notes.

export const DRIVER_STATUSES = [
  { id: 'assigned', label: 'Assignée' },
  { id: 'on_way', label: 'En route' },
  { id: 'arrived', label: 'Sur place' },
  { id: 'on_board', label: 'Client à bord' },
  { id: 'done', label: 'Terminée' },
] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number]['id'];
export const driverStatusLabel = (s?: string) => DRIVER_STATUSES.find(x => x.id === s)?.label || 'Assignée';

export interface Job {
  id: string;               // = token
  reservationId: string;
  ref: string;
  date: string;
  time: string;
  service: string;
  pickup: string;
  destination: string;
  customerName: string;
  customerPhone: string;
  passengers?: number | null;
  luggage?: number | null;
  flightNumber?: string;
  signName?: string;
  message?: string;
  vehicle?: string;         // model + plate
  driverName?: string;
  bookingStatus: Reservation['status']; // lets the driver see a cancellation
  expiresAtMs: number;      // link stops working after this
  driverStatus: DriverStatus;
  driverStatusAt: string;
  updatedAt: string;
}

const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newJobToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join('');
}

export const jobUrl = (token: string) => `${window.location.origin}/mission/${token}`;

const firstName = (full: string) => (full || '').trim().split(/\s+/)[0] || full;

// Create (isNew) or refresh the driver copy of a booking. A refresh never touches the
// driver's progress (driverStatus / driverStatusAt).
export async function syncJob(
  r: Reservation,
  token: string,
  ctx: { services: Service[]; vehicles: Vehicle[]; drivers: Driver[]; units: FleetUnit[] },
  isNew: boolean,
) {
  const iv = bookingInterval(r);
  const unit = ctx.units.find(u => u.id === r.fleetUnitId);
  const model = ctx.vehicles.find(v => v.id === (unit?.modelId || r.vehicle))?.name || r.vehicle;
  const now = new Date().toISOString();
  const job: Omit<Job, 'id' | 'driverStatus' | 'driverStatusAt'> = {
    reservationId: r.id,
    ref: r.ref || r.id,
    date: r.date,
    time: r.time,
    service: ctx.services.find(s => s.id === r.service)?.title || r.service,
    pickup: r.pickup,
    destination: r.destination,
    customerName: firstName(r.fullName),
    customerPhone: r.phone,
    passengers: r.passengers ?? null,
    luggage: r.luggage ?? null,
    flightNumber: r.flightNumber || '',
    signName: r.signName || r.fullName,
    message: r.message || '',
    vehicle: unit ? `${model} · ${unit.plate}` : model,
    driverName: ctx.drivers.find(d => d.id === r.driverId)?.name || '',
    bookingStatus: r.status,
    // Valid until 2 days after the end of the trip
    expiresAtMs: Math.round((iv ? iv.end.getTime() : Date.now()) + 2 * 864e5),
    updatedAt: now,
  };
  if (isNew) await setDoc(doc(db, 'jobs', token), { ...job, driverStatus: 'assigned', driverStatusAt: now });
  else await setDoc(doc(db, 'jobs', token), job, { merge: true });
  // Logged against the booking, never the secret token
  if (isNew) logActivity('create', 'jobs', r.id, undefined, `Lien chauffeur ${job.ref}`);
}

export async function revokeJob(token: string, ref?: string) {
  await deleteDoc(doc(db, 'jobs', token));
  logActivity('delete', 'jobs', ref || 'lien', undefined, `Lien chauffeur ${ref || ''}`.trim());
}
