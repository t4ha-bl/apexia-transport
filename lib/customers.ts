import { Reservation } from './store/types';

// Extra details the team adds about a customer (stored in `customers/{phoneKey}`)
export interface CustomerProfile {
  id: string;           // = phone key
  vip?: boolean;
  company?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

// One customer as shown in the admin: profile + figures computed from their bookings
export interface Customer {
  key: string;
  name: string;          // name on their most recent booking
  phone: string;         // phone as typed on their most recent booking
  bookings: Reservation[];
  activeCount: number;   // bookings not cancelled
  totalSpent: number;    // sum of agreed prices on confirmed bookings (MAD)
  lastTrip?: string;     // most recent past trip date (YYYY-MM-DD)
  nextTrip?: string;     // next upcoming trip date
  profile?: CustomerProfile;
}

// International digits for a phone number. New bookings store "+33 6…"; older ones were
// typed without a code and are Moroccan ("06…" or "6…").
export function phoneKey(phone: string): string {
  const raw = (phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  if (digits.length === 9) return '212' + digits;
  return digits;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function buildCustomers(reservations: Reservation[], profiles: CustomerProfile[]): Customer[] {
  const byKey = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const key = phoneKey(r.phone);
    if (!key) continue;
    const list = byKey.get(key) || [];
    list.push(r);
    byKey.set(key, list);
  }
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const now = today();
  return Array.from(byKey.entries()).map(([key, list]) => {
    const sorted = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const active = list.filter(r => r.status !== 'cancelled');
    const past = active.map(r => r.date).filter(d => d && d < now).sort();
    const future = active.map(r => r.date).filter(d => d && d >= now).sort();
    return {
      key,
      name: sorted[0].fullName,
      phone: sorted[0].phone,
      bookings: [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      activeCount: active.length,
      totalSpent: list.filter(r => r.status === 'confirmed' && typeof r.price === 'number').reduce((s, r) => s + (r.price as number), 0),
      lastTrip: past[past.length - 1],
      nextTrip: future[0],
      profile: profileMap.get(key),
    };
  });
}
