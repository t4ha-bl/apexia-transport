// Shared by the admin (browser) and the daily e-mail job (server): no Firebase import here.
import { Reservation } from './store/types';

// Stored at `settings/reviews` (public read: nothing secret in it)
export interface ReviewSettings {
  googleUrl: string;   // the "ask for reviews" link from the Google Business Profile
  autoEmail: boolean;  // e-mail customers who gave an address, the day after the trip
  messageFr: string;
  messageEn: string;
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  googleUrl: '',
  autoEmail: true,
  messageFr:
    "Bonjour {prenom}, merci d'avoir voyagé avec Apexia Transport. Comment s'est passée votre course {ref} ? " +
    'Votre avis prend 30 secondes et nous aide beaucoup : {lien}',
  messageEn:
    'Hello {prenom}, thank you for travelling with Apexia Transport. How was your ride {ref}? ' +
    'Your feedback takes 30 seconds and helps us a lot: {lien}',
};

export const withReviewDefaults = (s?: Partial<ReviewSettings> | null): ReviewSettings => ({
  ...DEFAULT_REVIEW_SETTINGS,
  ...Object.fromEntries(Object.entries(s || {}).filter(([, v]) => v !== undefined && v !== '')),
  // An empty Google link is a valid choice; the toggle must keep `false`
  googleUrl: s?.googleUrl ?? '',
  autoEmail: s?.autoEmail ?? DEFAULT_REVIEW_SETTINGS.autoEmail,
});

// Review links stay valid for 30 days
export const REVIEW_TTL_MS = 30 * 864e5;

export type ReviewChannel = 'whatsapp' | 'email' | 'link';

// A review request, stored at `reviews/{secret token}`. Only the first name is copied:
// the customer page never needs the phone, the price or the addresses.
export interface Review {
  id: string;               // = token
  reservationId: string;
  ref: string;
  firstName: string;
  service: string;
  date: string;
  lang: 'fr' | 'en';
  channel: ReviewChannel;
  createdAt: string;
  createdBy: string;
  expiresAtMs: number;
  rating: number | null;
  comment: string;
  submittedAt: any;         // Firestore timestamp once the customer answered
  followUpDone: boolean;
  followUpAt?: string;
  followUpBy?: string;
}

export const firstNameOf = (full?: string) => (full || '').trim().split(/\s+/)[0] || '';

export function newReviewDoc(
  r: Reservation, serviceTitle: string, channel: ReviewChannel, createdBy: string, now = new Date(),
): Omit<Review, 'id'> {
  return {
    reservationId: r.id,
    ref: r.ref || r.id,
    firstName: firstNameOf(r.fullName).slice(0, 60),
    service: (serviceTitle || r.service || '').slice(0, 100),
    date: r.date,
    lang: r.lang === 'en' ? 'en' : 'fr',
    channel,
    createdAt: now.toISOString(),
    createdBy,
    expiresAtMs: now.getTime() + REVIEW_TTL_MS,
    rating: null,
    comment: '',
    submittedAt: null,
    followUpDone: false,
  };
}

export function reviewMessage(settings: ReviewSettings, lang: 'fr' | 'en', vars: { prenom: string; ref: string; lien: string }) {
  const tpl = lang === 'en' ? settings.messageEn : settings.messageFr;
  return tpl
    .replace(/\{prenom\}/g, vars.prenom)
    .replace(/\{ref\}/g, vars.ref)
    .replace(/\{lien\}/g, vars.lien)
    .replace(/\s+,/g, ',') // tidy "Bonjour , merci" when {prenom} is empty
    .trim();
}

export const isValidEmail = (e?: string) => !!e && e.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
