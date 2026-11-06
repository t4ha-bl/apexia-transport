// SERVER ONLY: privileged Firestore access for API routes. Never import from client code.
// Credentials come from the FIREBASE_SERVICE_ACCOUNT env var (the JSON key from
// Firebase console > Project settings > Service accounts), set only in Vercel.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

export function adminDb(): Firestore | null {
  if (!getApps().length) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      // Local test mode (npm run dev:test): no credentials needed
      initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-apexia' });
    } else {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) return null; // feature not configured yet
      try {
        initializeApp({ credential: cert(JSON.parse(raw)) });
      } catch (err) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT value', err);
        return null;
      }
    }
  }
  return getFirestore();
}
