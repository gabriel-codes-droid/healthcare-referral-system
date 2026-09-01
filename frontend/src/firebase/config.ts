import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase web configuration is intentionally client-side. The values are
 * identifiers, not service-account credentials. Environment variables can
 * override the checked-in defaults for another Firebase project.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBNXwhE3pKmz0BJAByhPIbsPSJCfTMwBE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'healthcare-referral-syst-8e790.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'healthcare-referral-syst-8e790',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '873535945217',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:873535945217:web:581d21459091c4c16d9e00',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NGXCEDWCXY'
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export function getDB(): Firestore {
  return db;
}

export function getAuthInstance(): Auth {
  return auth;
}

export { app, db, auth };
export default firebaseConfig;
