import { getAdminAuth } from "@/lib/firebase-admin-server";

export async function deleteTeamAuthOnServer(teamId: string): Promise<void> {
  const auth = getAdminAuth();

  try {
    await auth.deleteUser(teamId);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "auth/user-not-found") {
      throw error;
    }
  }
}

export async function deleteStaffAccountOnServer(uid: string): Promise<void> {
  const { getAdminFirestore } = await import("@/lib/firebase-admin-server");
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  await db.doc(`users/${uid}`).delete();

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "auth/user-not-found") {
      throw error;
    }
  }
}
