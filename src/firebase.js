import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration is loaded from Vite env vars.
// Ensure you have a .env file at the project root with these values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

let app = null;
let auth = null;
let db = null;
let analytics = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Initialize Firestore with a persistent local cache when available.
  // This replaces the deprecated `enableIndexedDbPersistence()` call.
  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, { localCache: persistentLocalCache() });
    } catch (err) {
      console.warn('Persistent cache not enabled; falling back to default Firestore:', err?.message || err);
      db = initializeFirestore(app, {});
    }
  } else {
    db = initializeFirestore(app, {});
  }

  // Initialize analytics if Measurement ID is present and running in a browser.
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn('Firebase Analytics initialization failed:', err);
    }
  }
} else {
  console.warn(
    'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in your .env file.',
  );
}

export { app, auth, db, analytics, signInAnonymously, onAuthStateChanged, isFirebaseConfigured };
