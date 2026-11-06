import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Local test mode (npm run dev:test): talk to the Firebase emulators on this PC
// instead of the real project. The "demo-" project id can never reach real data.
export const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = USE_EMULATOR
  ? { apiKey: 'demo-key', authDomain: 'demo-apexia.firebaseapp.com', projectId: 'demo-apexia', appId: 'demo-app' }
  : {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

// Prevent duplicate app initialization in Next.js dev mode
const firstInit = getApps().length === 0;
const app = firstInit ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);

if (USE_EMULATOR && firstInit) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export default app;
