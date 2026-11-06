import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Reservation } from './store/types';
import { newJobToken } from './jobs';
import { logActivity } from './activity';
import { newReviewDoc, Review, ReviewChannel } from './reviewTemplates';
import { bookingInterval } from './bookings';

export const reviewUrl = (token: string) => `${window.location.origin}/avis/${token}`;

// Create the secret review link for a finished trip and remember it on the booking,
// in one atomic write. Returns the token.
export async function createReviewRequest(r: Reservation, serviceTitle: string, channel: ReviewChannel) {
  const token = newJobToken();
  const batch = writeBatch(db);
  const now = new Date();
  batch.set(doc(db, 'reviews', token), newReviewDoc(r, serviceTitle, channel, auth.currentUser?.email?.toLowerCase() || '', now));
  batch.update(doc(db, 'reservations', r.id), { reviewToken: token, reviewRequestedAt: now.toISOString() });
  await batch.commit();
  logActivity('create', 'reviews', r.id, undefined, `Demande d'avis ${r.ref || ''} · ${channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'e-mail' : 'lien'}`);
  return token;
}

export async function markFollowedUp(review: Review, done = true) {
  await updateDoc(doc(db, 'reviews', review.id), {
    followUpDone: done,
    followUpAt: new Date().toISOString(),
    followUpBy: auth.currentUser?.email?.toLowerCase() || '',
  });
  logActivity('update', 'reviews', review.reservationId, undefined, `Avis ${review.ref} · ${done ? 'client recontacté' : 'à rappeler'}`);
}

// Latest review requests, newest first (team only)
export const subscribeReviews = (max: number, onData: (rows: Review[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(
    query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(max)),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))),
    err => onError?.(err),
  );

// Confirmed trips that ended (2 h ago or more) within the last `days` days and
// have not been asked for a review yet
export function awaitingReview(all: Reservation[], days = 14, now = Date.now()) {
  return all
    .filter(r => {
      if (r.status !== 'confirmed' || r.reviewToken || (r as any).anonymizedAt) return false;
      const iv = bookingInterval(r);
      if (!iv) return false;
      const end = iv.end.getTime();
      return end + 2 * 3600e3 <= now && end >= now - days * 864e5;
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export const isSubmitted = (r: Review) => typeof r.rating === 'number';
