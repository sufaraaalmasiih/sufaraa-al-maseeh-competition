import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const SECONDARY_APP_NAME = "sufaraa-staff-bootstrap";

let clientAuth: Auth | null = null;
let secondaryAuth: Auth | null = null;
let persistenceConfigured = false;
let persistencePromise: Promise<void> | null = null;

/** Single auth instance for the browser — Firebase returns the same object per app. */
export function getClientFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    return getAuth(firebaseApp);
  }

  clientAuth ??= getAuth(firebaseApp);
  return clientAuth;
}

/** Ensure auth sessions persist across page loads before sign-in. */
export function ensureAuthPersistence(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const auth = getClientFirebaseAuth();

  if (!persistencePromise) {
    persistencePromise = (
      persistenceConfigured
        ? Promise.resolve()
        : setPersistence(auth, browserLocalPersistence)
    )
      .then(() => {
        persistenceConfigured = true;
      })
      .catch(() => {
        persistenceConfigured = true;
      });
  }

  return persistencePromise;
}

/**
 * Auth instance for creating staff accounts without signing out the current super admin.
 */
export function getSecondaryFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    const secondaryApp = getApps().find((app) => app.name === SECONDARY_APP_NAME)
      ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
    return getAuth(secondaryApp);
  }

  if (!secondaryAuth) {
    const secondaryApp = getApps().find((app) => app.name === SECONDARY_APP_NAME)
      ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
    secondaryAuth = getAuth(secondaryApp);
  }

  return secondaryAuth;
}

export function logFirebaseClientInit(): void {
  // no-op — kept for call-site compatibility
}

/** Same singleton as getClientFirebaseAuth(); prefer getClientFirebaseAuth() in new code. */
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
