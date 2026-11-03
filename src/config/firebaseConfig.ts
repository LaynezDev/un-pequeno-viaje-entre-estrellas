import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseCredentials {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

declare global {
  interface Window {
    __FIREBASE_WEBAPP_CONFIG__?: FirebaseCredentials | string;
  }
  const __BUILD_FIREBASE_WEBAPP_CONFIG__: string;
}

const LOCAL_FIREBASE_CONFIG_KEY = 'cg_firebase_RuntimeConfig_v1';

function parseConfigCandidate(candidate: unknown): FirebaseCredentials | null {
  if (!candidate) return null;
  try {
    const obj =
      typeof candidate === 'string'
        ? (JSON.parse(candidate) as FirebaseCredentials)
        : (candidate as FirebaseCredentials);
    if (obj && typeof obj === 'object' && obj.apiKey && obj.projectId) {
      return {
        ...obj,
        authDomain: obj.authDomain || `${obj.projectId}.firebaseapp.com`,
      };
    }
  } catch {
    // ignore malformed candidate
  }
  return null;
}

/**
 * Reads Firebase credentials in priority order:
 * 1. Firebase App Hosting runtime injection (window.__FIREBASE_WEBAPP_CONFIG__)
 * 2. Vite envPrefix FIREBASE_WEBAPP_CONFIG (import.meta.env.FIREBASE_WEBAPP_CONFIG)
 * 3. Build-time define (__BUILD_FIREBASE_WEBAPP_CONFIG__)
 * 4. Vite .env variables (VITE_FIREBASE_*)
 * 5. Runtime credentials saved in localStorage
 * 6. Already initialized Firebase App options (from @firebase/util postinstall)
 */
export function getFirebaseCredentials(): FirebaseCredentials | null {
  // 1. Runtime injection from server.mjs
  if (typeof window !== 'undefined' && window.__FIREBASE_WEBAPP_CONFIG__) {
    const parsed = parseConfigCandidate(window.__FIREBASE_WEBAPP_CONFIG__);
    if (parsed) return parsed;
  }

  // 2. Vite import.meta.env.FIREBASE_WEBAPP_CONFIG
  const metaEnv = import.meta.env as Record<string, string | undefined>;
  if (metaEnv.FIREBASE_WEBAPP_CONFIG) {
    const parsed = parseConfigCandidate(metaEnv.FIREBASE_WEBAPP_CONFIG);
    if (parsed) return parsed;
  }

  // 3. Build-time define injection
  try {
    if (
      typeof __BUILD_FIREBASE_WEBAPP_CONFIG__ !== 'undefined' &&
      __BUILD_FIREBASE_WEBAPP_CONFIG__
    ) {
      const parsed = parseConfigCandidate(__BUILD_FIREBASE_WEBAPP_CONFIG__);
      if (parsed) return parsed;
    }
  } catch {
    // ignore
  }

  // 4. Vite .env variables (VITE_FIREBASE_*)
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

  // 5. LocalStorage saved from /mi_dashboard
  try {
    const raw = localStorage.getItem(LOCAL_FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = parseConfigCandidate(raw);
      if (parsed) return parsed;
    }
  } catch {
    // ignore storage errors
  }

  // 6. Check if Firebase App was already auto-initialized via @firebase/util postinstall
  try {
    const apps = getApps();
    if (apps.length > 0 && apps[0].options?.apiKey && apps[0].options?.projectId) {
      return {
        apiKey: apps[0].options.apiKey,
        projectId: apps[0].options.projectId,
        authDomain:
          apps[0].options.authDomain ||
          `${apps[0].options.projectId}.firebaseapp.com`,
        storageBucket: apps[0].options.storageBucket,
        messagingSenderId: apps[0].options.messagingSenderId,
        appId: apps[0].options.appId,
      };
    }
  } catch {
    // ignore
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

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAppInstance = existingApps[0];
    } else if (creds) {
      firebaseAppInstance = initializeApp(creds);
    } else {
      // Try zero-argument auto-initialization (supported by Firebase App Hosting postinstall)
      firebaseAppInstance = initializeApp();
    }

    if (!firebaseAppInstance?.options?.projectId) {
      return null;
    }

    firestoreInstance = getFirestore(firebaseAppInstance);
    return firestoreInstance;
  } catch {
    return null;
  }
}

export function isFirebaseConnected(): boolean {
  return getDb() !== null;
}
