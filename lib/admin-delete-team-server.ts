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
  authError: string | null;
}> {
  const { deletedAnswers } = await deleteTeamFirestoreOnServer(teamId);

  let authDeleted = false;
  let authError: string | null = null;
  try {
    await deleteTeamAuthOnServer(teamId);
    authDeleted = true;
  } catch (error) {
    // Surface the real reason instead of swallowing it — the UI used to blame a
    // missing FIREBASE_SERVICE_ACCOUNT even when the actual cause was different.
    authDeleted = false;
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message;
    authError = code ?? message ?? "auth-delete-failed";
  }

  return { deletedAnswers, authDeleted, authError };
}

export async function updateTeamAuthCredentialsOnServer(
  uid: string,
  input: { email?: string; password?: string },
  /** مسار مستند الملف لمزامنة البريد + النسخة النصّية لكلمة المرور (teams/coaches). */
  profileDocPath: string | null = `teams/${uid}`,
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

  // مزامنة المستند بعد نجاح Auth فقط: البريد المعروض + النسخة النصّية لكلمة المرور
  // (بطلب المالك) — فلا تظهر أبداً كلمة مرور لا تعمل فعلاً.
  if (profileDocPath) {
    const mirror: { email?: string; accountPasswordPlain?: string } = {};
    if (update.email) {
      mirror.email = update.email;
    }
    if (update.password) {
      mirror.accountPasswordPlain = update.password;
    }
    try {
      const { getAdminFirestore } = await import("@/lib/firebase-admin-server");
      await getAdminFirestore().doc(profileDocPath).set(mirror, { merge: true });
    } catch {
      // مزامنة العرض غير حرجة — تحديث Auth هو المصدر الموثوق.
    }
  }

  return {
    emailUpdated: Boolean(update.email),
    passwordUpdated: Boolean(update.password),
  };
}

export async function deleteCoachCompletelyOnServer(uid: string): Promise<{
  authDeleted: boolean;
  authError: string | null;
}> {
  const { getAdminFirestore } = await import("@/lib/firebase-admin-server");
  await getAdminFirestore().doc(`coaches/${uid}`).delete();

  let authDeleted = false;
  let authError: string | null = null;
  try {
    await getAdminAuth().deleteUser(uid);
    authDeleted = true;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/user-not-found") {
      authDeleted = true;
    } else {
      authDeleted = false;
      authError = code ?? (error as { message?: string }).message ?? "auth-delete-failed";
    }
  }

  return { authDeleted, authError };
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
