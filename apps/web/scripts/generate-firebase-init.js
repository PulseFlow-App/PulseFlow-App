/**
 * Writes public/_/firebase/init.json from VITE_FIREBASE_* env for Firebase Auth redirect.
 * The Auth handler requests this file; without it you get 404 and redirect can fail.
 * Run from apps/web before vite build (e.g. npm run build).
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const outPath = join(process.cwd(), 'public', '_', 'firebase', 'init.json');

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(config, null, 0), 'utf8');
