// Starts a second Next.js dev server on port 3001 that uses the local Firebase
// emulators (see lib/firebase.ts). Run `npm run emulators` first, then `npm run seed:test`.
const { spawn } = require('child_process');

const child = spawn('npx', ['next', 'dev', '-p', '3001'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    NEXT_DIST_DIR: '.next-test',
    // Server routes (firebase-admin) also use the emulator; e-mails are only logged
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    GCLOUD_PROJECT: 'demo-apexia',
    ALERT_DRY_RUN: 'true',
    CRON_SECRET: 'local-test-cron',
  },
});
child.on('exit', code => process.exit(code ?? 0));
