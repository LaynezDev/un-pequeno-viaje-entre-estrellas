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

declare global {
  interface Window {
    __FIREBASE_WEBAPP_CONFIG__?: FirebaseCredentials;
  }
  const __BUILD_FIREBASE_WEBAPP_CONFIG__: string;
}

const LOCAL_FIREBASE_CONFIG_KEY = 'cg_firebase_RuntimeConfig_v1';

/**
 * Reads Firebase credentials in priority order:
 * 1. Firebase App Hosting runtime injection (window.__FIREBASE_WEBAPP_CONFIG__)
 * 2. Firebase App Hosting build-time injection (process.env.FIREBASE_WEBAPP_CONFIG)
 * 3. Vite .env variables (VITE_FIREBASE_*)
 * 4. Runtime credentials saved in /mi_dashboard
 */
export function getFirebaseCredentials(): FirebaseCredentials | null {
  // 1. Runtime injection from server.mjs on Firebase App Hosting / Cloud Run
  if (
    typeof window !== 'undefined' &&
    window.__FIREBASE_WEBAPP_CONFIG__?.apiKey &&
    window.__FIREBASE_WEBAPP_CONFIG__?.projectId
  ) {
    return window.__FIREBASE_WEBAPP_CONFIG__;
  }

  // 2. Build-time injection from FIREBASE_WEBAPP_CONFIG
  try {
    if (
      typeof __BUILD_FIREBASE_WEBAPP_CONFIG__ === 'string' &&
      __BUILD_FIREBASE_WEBAPP_CONFIG__.trim().startsWith('{')
    ) {
      const parsed = JSON.parse(
        __BUILD_FIREBASE_WEBAPP_CONFIG__
      ) as FirebaseCredentials;
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 3. Vite .env variables
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

  // 4. LocalStorage saved from /mi_dashboard
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
