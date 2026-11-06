// Fills the LOCAL Firebase emulators with test data (never touches the real project's data):
//  - a test admin account (credentials below, emulator only)
//  - a copy of the public catalogue (services, vehicles, partners, settings) read from the live site
//  - a few fake reservations
// Usage: npm run emulators   (in one terminal)   then   npm run seed:test
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, setDoc } = require('firebase/firestore');

// Test-only accounts, valid in the local emulator only (one per role)
const TEST_ADMIN = { email: 'admin@apexia.test', password: 'Test-Admin-2026!', name: 'Test Owner', role: 'owner' };
const TEST_TEAM = [
  TEST_ADMIN,
  { email: 'dispatch@apexia.test', password: 'Test-Dispatch-2026!', name: 'Test Dispatcher', role: 'dispatcher' },
  { email: 'compta@apexia.test', password: 'Test-Compta-2026!', name: 'Test Comptable', role: 'accountant' },
  // Has a login but is NOT on the team list: must be refused everywhere
  { email: 'outsider@apexia.test', password: 'Test-Outsider-2026!', name: 'Outsider', role: null },
];

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split(/\r?\n/).filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);

// Read-only access to the live project's PUBLIC collections
const live = getFirestore(initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
}, 'live'));

const testApp = initializeApp({ apiKey: 'demo-key', projectId: 'demo-apexia', appId: 'demo-app' }, 'test');
const testAuth = getAuth(testApp);
const testDb = getFirestore(testApp);
connectAuthEmulator(testAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(testDb, '127.0.0.1', 8080);

const isoDay = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

(async () => {
  // Login accounts + team-list entries (written with emulator admin rights)
  for (const m of TEST_TEAM) {
    try { await createUserWithEmailAndPassword(testAuth, m.email, m.password); } catch { /* already exists */ }
    if (!m.role) continue;
    await fetch('http://127.0.0.1:8080/v1/projects/demo-apexia/databases/(default)/documents/admins/' + encodeURIComponent(m.email), {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { email: { stringValue: m.email }, name: { stringValue: m.name }, role: { stringValue: m.role }, active: { booleanValue: true } } }),
    });
  }
  // Seed the rest as the owner
  await signInWithEmailAndPassword(testAuth, TEST_ADMIN.email, TEST_ADMIN.password);

  for (const name of ['services', 'vehicles', 'partners', 'settings']) {
    const snap = await getDocs(collection(live, name));
    for (const d of snap.docs) await setDoc(doc(testDb, name, d.id), d.data());
    console.log(`copied ${snap.size} ${name}`);
  }

  const fake = [
    { ref: 'APEX-1001', fullName: 'Sarah Martin', phone: '+33 612345678', service: 'transfert-aeroport', vehicle: 'mercedes-v', date: isoDay(0), time: '14:30', pickup: 'Aéroport Mohammed V (CMN)', destination: 'Hyatt Regency Casablanca', message: '3 passagers, 4 valises. Vol AF1452.', status: 'pending' },
    { ref: 'APEX-1002', fullName: 'Youssef Benali', phone: '+212 661234567', service: 'mise-a-disposition', vehicle: 'mercedes-s', date: isoDay(1), time: '09:00', pickup: 'Sofitel Rabat Jardin des Roses', destination: 'Rabat (rendez-vous)', status: 'confirmed' },
    { ref: 'APEX-1003', fullName: 'John Carter', phone: '+44 7700900123', service: 'tours-prives', vehicle: 'range-rover', date: isoDay(2), time: '08:00', pickup: 'Riad Fès', destination: 'Chefchaouen', address: 'Riad Fès, Derb Ben Slimane', status: 'pending' },
    { ref: 'APEX-1004', fullName: 'Sarah Martin', phone: '+33 612345678', service: 'transfert-aeroport', vehicle: 'mercedes-v', date: isoDay(-10), time: '18:00', pickup: 'Hyatt Regency Casablanca', destination: 'Aéroport Mohammed V (CMN)', status: 'confirmed' },
    { ref: 'APEX-1005', fullName: 'Event Agency Atlas', phone: '+212 522000000', service: 'transport-evenementiel', vehicle: 'sprinter', date: isoDay(-3), time: '19:00', pickup: 'Hôtel Mövenpick Casablanca', destination: 'Anfa Park', status: 'cancelled' },
  ];
  for (const r of fake) {
    await setDoc(doc(testDb, 'reservations', r.ref), { ...r, createdAt: new Date(Date.now() - Math.random() * 5 * 864e5).toISOString() });
  }
  console.log(`added ${fake.length} fake reservations`);
  console.log(`test admin ready: ${TEST_ADMIN.email} (password in scripts/seed-emulator.cjs)`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
