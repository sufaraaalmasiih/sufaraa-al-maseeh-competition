import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin-server";

const MAIN_COMPETITION_ID = "main";
const FIRESTORE_BATCH_LIMIT = 500;

export async function deleteTeamCompletelyOnServer(
  teamId: string,
): Promise<{ deletedAnswers: number }> {
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  const answersSnap = await db
    .collection(`competitions/${MAIN_COMPETITION_ID}/answers`)
    .where("teamId", "==", teamId)
    .get();

  const answerRefs = answersSnap.docs.map((docSnap) => docSnap.ref);
  for (let index = 0; index < answerRefs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = answerRefs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await db.doc(`competitions/${MAIN_COMPETITION_ID}/teamStates/${teamId}`).delete();
  await db.doc(`teams/${teamId}`).delete();

  try {
    await auth.deleteUser(teamId);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "auth/user-not-found") {
      throw error;
    }
  }

  return { deletedAnswers: answerRefs.length };
}

export async function deleteStaffAccountOnServer(uid: string): Promise<void> {
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
