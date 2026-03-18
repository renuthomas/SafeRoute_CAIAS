import { collection, addDoc, doc, onSnapshot, query, orderBy, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, signInAnonymously, onAuthStateChanged, isFirebaseConfigured } from '../firebase';

let authInitialized = false;

export async function initFirebaseAuth() {
  if (authInitialized) return;
  authInitialized = true;

  if (!isFirebaseConfigured || !auth) {
    console.warn('Firebase is not configured. Skipping anonymous auth.');
    return;
  }

  // Attempt anonymous sign-in (or re-use existing session)
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      // When the Firebase API key is wrong or the project isn't set up, this can happen.
      // Avoid retry storms in the console by recognizing the common error codes.
      if (err?.code === 'auth/configuration-not-found' || err?.code === 'auth/invalid-api-key') {
        console.warn(
          'Firebase anonymous auth failed (configuration issue). Please verify your Firebase API key and project settings in .env.',
          err,
        );
      } else {
        console.warn('Anonymous auth failed:', err);
      }
    }
  }

  // Keep the auth session active
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.debug('Firebase auth signed in anonymously', user.uid);
    }
  });
}

export async function reportIncident({ type, description, location = null, anonymous = true }) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to report incident because Firebase is not configured.');
    return null;
  }

  const incidentsRef = collection(db, 'incidents');
  const payload = {
    type,
    description: description || null,
    anonymous: anonymous ?? true,
    createdAt: serverTimestamp(),
  };

  if (location && typeof location === 'object' && location.lat != null && location.lng != null) {
    payload.location = {
      lat: location.lat,
      lng: location.lng,
    };
  }

  const doc = await addDoc(incidentsRef, payload);
  return { id: doc.id, ...payload };
}

export function subscribeToIncidents(onChange) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to incidents because Firebase is not configured.');
    return () => {};
  }

  const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onChange(items);
  });
}

export function subscribeToScores(onChange) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to scores because Firebase is not configured.');
    return () => {};
  }

  const q = query(collection(db, 'scores'), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onChange(items);
  });
}

export function subscribeToRoutes(onChange) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to routes because Firebase is not configured.');
    return () => {};
  }

  const q = query(collection(db, 'routes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onChange(items);
  });
}

export function subscribeToAlerts(onChange) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to alerts because Firebase is not configured.');
    return () => {};
  }

  const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onChange(items);
  });
}

export function subscribeToBuddyLocations(token, onChange) {
  if (!token) return () => {};
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to buddy locations because Firebase is not configured.');
    return () => {};
  }
  const q = query(collection(db, 'buddies', token, 'locations'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onChange(items);
  });
}

export function subscribeToBuddySession(token, onChange) {
  if (!token) return () => {};
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to subscribe to buddy session because Firebase is not configured.');
    return () => {};
  }

  const docRef = doc(db, 'buddies', token);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }
    onChange({ id: snapshot.id, ...snapshot.data() });
  });
}

export async function createBuddySession(token, metadata = {}) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to create buddy session because Firebase is not configured.');
    return null;
  }

  const docRef = doc(db, 'buddies', token);
  await setDoc(docRef, {
    token,
    active: true,
    createdAt: serverTimestamp(),
    expiresAt: null,
    ...metadata,
  });
  return token;
}

export async function endBuddySession(token) {
  if (!token) return;
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to end buddy session because Firebase is not configured.');
    return;
  }

  const docRef = doc(db, 'buddies', token);
  await updateDoc(docRef, {
    active: false,
    endedAt: serverTimestamp(),
  });
}

export async function addBuddyLocation(token, { lat, lng }) {
  if (!token) return null;
  if (!isFirebaseConfigured || !db) {
    console.warn('Unable to add buddy location because Firebase is not configured.');
    return null;
  }

  const locationsRef = collection(db, 'buddies', token, 'locations');
  const doc = await addDoc(locationsRef, {
    lat,
    lng,
    timestamp: serverTimestamp(),
  });
  return doc.id;
}

export { isFirebaseConfigured };
