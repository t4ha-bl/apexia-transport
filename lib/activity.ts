import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Append-only activity log (`activity`, owner-only reading, see firestore.rules).
// Called automatically by the write helpers in firebaseUtils.ts for every admin change.

export type ActivityAction = 'create' | 'update' | 'delete' | 'bulk' | 'export';

export interface ActivityEntry {
  id: string;
  at: { toDate: () => Date } | null;
  actorEmail: string;
  action: ActivityAction;
  collection: string;
  docId?: string;
  label?: string;
  changes?: string[];
}

// Not worth logging (internal counters, the log itself)
const SKIP = new Set(['activity', 'counters']);

// Personal data: the log records that these fields changed, never their values,
// so erasing a customer's data (law 09-08) leaves nothing behind in the log
const PERSONAL = new Set([
  'fullName', 'phone', 'address', 'message', 'email', 'notes', 'signName', 'customer',
  'customerName', 'customerPhone', 'company', 'tags', 'comment',
]);

const MASKED_COLLECTIONS = new Set(['customers']); // their document id is a phone number

export const maskTail = (s: string) => (s.length > 3 ? `•••${s.slice(-3)}` : '•••');

function short(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.length} élément(s)]`;
  return '{…}';
}

function summarize(data: Record<string, unknown>): string[] {
  return Object.entries(data)
    .filter(([k]) => k !== 'updatedAt' && k !== 'createdAt')
    .slice(0, 40)
    .map(([k, v]) => (PERSONAL.has(k) ? `${k} (modifié)` : `${k} : ${short(v)}`).slice(0, 120));
}

function guessLabel(coll: string, docId: string, d?: Record<string, unknown>): string {
  const pick = (k: string) => (typeof d?.[k] === 'string' && d[k] ? String(d[k]) : '');
  if (coll === 'reservations') return pick('ref') || docId;           // never the customer's name
  if (MASKED_COLLECTIONS.has(coll)) return `Client ${maskTail(docId)}`;
  return pick('number') || pick('ref') || pick('name') || pick('title') || pick('plate') || pick('email') || pick('label') || docId;
}

export function logActivity(action: ActivityAction, coll: string, docId: string, data?: Record<string, unknown>, label?: string) {
  const email = auth.currentUser?.email?.toLowerCase();
  if (!email || SKIP.has(coll)) return; // public visitors (bookings) are not team actions
  const id = MASKED_COLLECTIONS.has(coll) ? maskTail(docId) : docId;
  const entry: Record<string, unknown> = {
    at: serverTimestamp(),
    actorEmail: email,
    action,
    collection: coll,
    docId: String(id).slice(0, 200),
    label: (label || guessLabel(coll, docId, data)).slice(0, 200),
  };
  if (data) entry.changes = summarize(data);
  // Fire-and-forget: logging never blocks or breaks the action itself
  addDoc(collection(db, 'activity'), entry).catch(err => console.warn('Activity log failed', err));
}
