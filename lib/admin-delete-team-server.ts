import { getAdminAuth } from "@/lib/firebase-admin-server";

const MAIN_COMPETITION_ID = "main";
const FIRESTORE_BATCH_LIMIT = 500;

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

export async function deleteTeamFirestoreOnServer(
  teamId: string,
  competitionId: string = MAIN_COMPETITION_ID,
): Promise<{ deletedAnswers: number }> {
  const { getAdminFirestore } = await import("@/lib/firebase-admin-server");
  const db = getAdminFirestore();

  const answersSnap = await db
    .collection("competitions")
    .doc(competitionId)
    .collection("answers")
    .where("teamId", "==", teamId)
    .get();

  const answerDocs = answersSnap.docs;
  for (let index = 0; index < answerDocs.length; index += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch();
    answerDocs.slice(index, index + FIRESTORE_BATCH_LIMIT).forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  await db
    .collection("competitions")
    .doc(competitionId)
    .collection("teamStates")
    .doc(teamId)
    .delete();

  await db.collection("teams").doc(teamId).delete();

  return { deletedAnswers: answerDocs.length };
}

export async function deleteTeamCompletelyOnServer(teamId: string): Promise<{
  deletedAnswers: number;
  authDeleted: boolean;
}> {
  const { deletedAnswers } = await deleteTeamFirestoreOnServer(teamId);

  let authDeleted = false;
  try {
    await deleteTeamAuthOnServer(teamId);
    authDeleted = true;
  } catch {
    authDeleted = false;
  }

  return { deletedAnswers, authDeleted };
}

export async function updateTeamAuthCredentialsOnServer(
  uid: string,
  input: { email?: string; password?: string },
): Promise<{ emailUpdated: boolean; passwordUpdated: boolean }> {
  const auth = getAdminAuth();
  const update: { email?: string; password?: string } = {};
  if (input.email) {
    update.email = input.email;
  }
  if (input.password) {
    update.password = input.password;
  }

  if (!update.email && !update.password) {
    return { emailUpdated: false, passwordUpdated: false };
  }

  await auth.updateUser(uid, update);
  return {
    emailUpdated: Boolean(update.email),
    passwordUpdated: Boolean(update.password),
  };
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
