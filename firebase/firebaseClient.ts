import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Allows Next.js build/prerender to finish when Netlify env vars are not yet set. */
const buildStubFirebaseConfig = {
  apiKey: "AIzaSy000000000000000000000000000000",
  authDomain: "build-stub.firebaseapp.com",
  projectId: "build-stub",
  storageBucket: "build-stub.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:buildstub000000",
};

function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

function resolveFirebaseConfig() {
  if (isFirebaseConfigured()) {
    return firebaseConfig;
  }

  if (typeof window === "undefined") {
    return buildStubFirebaseConfig;
  }

  throw new Error(
    "Missing Firebase configuration. Set NEXT_PUBLIC_FIREBASE_* environment variables.",
  );
}

let appInstance: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }

  if (getApps().length) {
    appInstance = getApp();
    return appInstance;
  }

  appInstance = initializeApp(resolveFirebaseConfig());
  return appInstance;
}

function bindLazy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = resolve();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(instance)
        : value;
    },
  });
}

/** Lazy singleton — avoids Firebase Auth init during Next.js prerender/build. */
export const firebaseApp = bindLazy(getFirebaseApp);

const SECONDARY_APP_NAME = "sufaraa-staff-bootstrap";

let clientAuth: Auth | null = null;
let secondaryAuth: Auth | null = null;
let lazyAuth: Auth | undefined;
let lazyFirestore: Firestore | undefined;
let lazyStorage: FirebaseStorage | undefined;
let persistenceConfigured = false;
let persistencePromise: Promise<void> | null = null;

function resolveFirebaseAuth(): Auth {
  if (!isFirebaseConfigured() && typeof window === "undefined") {
    throw new Error(
      "Firebase Auth is not available during SSR without NEXT_PUBLIC_FIREBASE_* variables.",
    );
  }

  lazyAuth ??= getAuth(getFirebaseApp());
  return lazyAuth;
}

/** Lazy singleton — do not initialize at module import time. */
export const firebaseAuth = bindLazy(resolveFirebaseAuth);

export const firestore = bindLazy(() => {
  lazyFirestore ??= getFirestore(getFirebaseApp());
  return lazyFirestore;
});

export const firebaseStorage = bindLazy(() => {
  lazyStorage ??= getStorage(getFirebaseApp());
  return lazyStorage;
});

/** Single auth instance for the browser — Firebase returns the same object per app. */
export function getClientFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    return resolveFirebaseAuth();
  }

  clientAuth ??= resolveFirebaseAuth();
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
  const config = resolveFirebaseConfig();

  if (typeof window === "undefined") {
    const secondaryApp =
      getApps().find((app) => app.name === SECONDARY_APP_NAME) ??
      initializeApp(config, SECONDARY_APP_NAME);
    return getAuth(secondaryApp);
  }

  if (!secondaryAuth) {
    const secondaryApp =
      getApps().find((app) => app.name === SECONDARY_APP_NAME) ??
      initializeApp(config, SECONDARY_APP_NAME);
    secondaryAuth = getAuth(secondaryApp);
  }

  return secondaryAuth;
}

export function logFirebaseClientInit(): void {
  // no-op — kept for call-site compatibility
}
