import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "sufaraaalmasiih-53478";

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const serviceAccount = JSON.parse(raw) as Record<string, string>;
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  }

  throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured.");
}

export function getAdminFirestore() {
  return getFirestore(initAdminApp());
}

export function getAdminAuth() {
  return getAuth(initAdminApp());
}
