import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/** Public defaults for project sufaraaalmasiih-53478 (safe to embed in client). */
const PROJECT_DEFAULTS = {
  authDomain: "sufaraaalmasiih-53478.firebaseapp.com",
  projectId: "sufaraaalmasiih-53478",
  storageBucket: "sufaraaalmasiih-53478.firebasestorage.app",
  messagingSenderId: "118820359157",
  appId: "1:118820359157:web:ded14cbe45cb2f5a5baebc",
} as const;

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("NEXT_PUBLIC_")) {
    return undefined;
  }

  return trimmed;
}

const firebaseConfig = {
  apiKey: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ??
    PROJECT_DEFAULTS.authDomain,
  projectId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ??
    PROJECT_DEFAULTS.projectId,
  storageBucket:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ??
    PROJECT_DEFAULTS.storageBucket,
  messagingSenderId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ??
    PROJECT_DEFAULTS.messagingSenderId,
  appId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ?? PROJECT_DEFAULTS.appId,
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

export function isFirebaseClientConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function resolveFirebaseConfig() {
  if (isFirebaseClientConfigured()) {
    return firebaseConfig;
  }

  if (typeof window === "undefined") {
    return buildStubFirebaseConfig;
  }

  return buildStubFirebaseConfig;
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
