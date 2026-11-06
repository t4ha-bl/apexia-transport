import { Reservation } from './store/types';

// Booking reference shown to customers, e.g. APEX-7K3Q9D.
// 6 characters from a 31-symbol alphabet (no 0/O, 1/I/L) = ~890 million combinations,
// so references stay unique in practice even at high volume.
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function newBookingRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'APEX-' + Array.from(bytes, b => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
}

export const BOOKING_SOURCES: { id: NonNullable<Reservation['source']>; label: string }[] = [
  { id: 'website', label: 'Site web' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'phone', label: 'Téléphone' },
  { id: 'email', label: 'E-mail' },
  { id: 'partner', label: 'Partenaire' },
  { id: 'other', label: 'Autre' },
];

export const sourceLabel = (s?: Reservation['source']) =>
  BOOKING_SOURCES.find(x => x.id === (s || 'website'))?.label || 'Site web';

// Typical job length per service, used when a booking has no explicit duration
// (the planning calendar uses it to detect overlapping jobs).
const DEFAULT_DURATION_MIN: Record<string, number> = {
  'transfert-aeroport': 90,
  'mise-a-disposition': 240,
  'tours-prives': 480,
  'multi-jours': 600,
  'transport-evenementiel': 240,
  'transport-entreprises': 120,
  'sur-mesure': 180,
};
export const bookingDuration = (r: Pick<Reservation, 'service' | 'durationMin'>) =>
  r.durationMin && r.durationMin > 0 ? r.durationMin : DEFAULT_DURATION_MIN[r.service] ?? 120;

// Start / end of a booking as Date objects (local time); null if the date/time is unusable
export function bookingInterval(r: Pick<Reservation, 'date' | 'time' | 'service' | 'durationMin'>) {
  if (!r.date) return null;
  const start = new Date(`${r.date}T${/^\d{2}:\d{2}$/.test(r.time || '') ? r.time : '00:00'}:00`);
  if (isNaN(start.getTime())) return null;
  return { start, end: new Date(start.getTime() + bookingDuration(r) * 60000) };
}

// Other active bookings using the same driver / vehicle unit at an overlapping time
export function findConflicts(
  target: Pick<Reservation, 'date' | 'time' | 'service' | 'durationMin'> & { id?: string },
  field: 'driverId' | 'fleetUnitId',
  value: string | null | undefined,
  all: Reservation[],
): Reservation[] {
  if (!value) return [];
  const t = bookingInterval(target);
  if (!t) return [];
  return all.filter(r => {
    if (r.id === target.id || r.status === 'cancelled' || r[field] !== value) return false;
    const o = bookingInterval(r);
    return !!o && o.start < t.end && t.start < o.end;
  });
}

export const formatMAD =(n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('fr-FR')} MAD` : '';
