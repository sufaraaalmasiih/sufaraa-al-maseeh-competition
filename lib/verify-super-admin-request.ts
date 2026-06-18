import { verifyFirebaseIdToken } from "@/lib/verify-firebase-id-token";

export async function verifySuperAdminRequest(
  request: Request,
): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) {
    return null;
  }

  const uid = await verifyFirebaseIdToken(idToken);
  if (!uid) {
    return null;
  }

  try {
    const { getAdminFirestore } = await import("@/lib/firebase-admin-server");
    const snapshot = await getAdminFirestore().doc(`users/${uid}`).get();
    const role = snapshot.data()?.role;
    if (role !== "super_admin") {
      return null;
    }
    return { uid };
  } catch {
    return null;
  }
}
