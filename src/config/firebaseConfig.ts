import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseCredentials {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const LOCAL_FIREBASE_CONFIG_KEY = 'cg_firebase_RuntimeConfig_v1';

/**
 * Reads Firebase credentials from Vite environment variables (.env)
 * or from runtime configuration saved in /mi_dashboard.
 */
export function getFirebaseCredentials(): FirebaseCredentials | null {
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${envProjectId}.appspot.com`,
      messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FirebaseCredentials;
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  return null;
}

export function saveRuntimeFirebaseCredentials(
  creds: FirebaseCredentials | null
): void {
  if (!creds) {
    localStorage.removeItem(LOCAL_FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(LOCAL_FIREBASE_CONFIG_KEY, JSON.stringify(creds));
  }
}

let firestoreInstance: Firestore | null = null;
let firebaseAppInstance: FirebaseApp | null = null;

export function getDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  const creds = getFirebaseCredentials();
  if (!creds) return null;

  try {
    const existingApps = getApps();
    firebaseAppInstance =
      existingApps.length > 0 ? existingApps[0] : initializeApp(creds);
    firestoreInstance = getFirestore(firebaseAppInstance);
    return firestoreInstance;
  } catch (err) {
    console.error('Error inicializando Firebase Firestore:', err);
    return null;
  }
}

export function isFirebaseConnected(): boolean {
  return getDb() !== null;
}
