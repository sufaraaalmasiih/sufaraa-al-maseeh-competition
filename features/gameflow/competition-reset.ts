import {
  type DocumentReference,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import {
  answersCollectionRef,
  buildInitialTeamStateDocument,
  gameFlowRef,
  MAIN_COMPETITION_ID,
  teamStatesCollectionRef,
  timerRef,
} from "@/firebase/firestore";
import { clearActiveSessionLink, completeActiveSession } from "@/features/facilitator/competition-session";
import { archiveAndClearObjections } from "@/features/facilitator/objections";
import {
  buildInitialGameFlowPayload,
  buildInitialTimerPayload,
} from "@/lib/competition-initial-payloads";

const FIRESTORE_BATCH_LIMIT = 500;

export interface CompetitionResetResult {
  deletedAnswers: number;
  resetTeamStates: number;
}

export class CompetitionResetError extends Error {
  constructor(
    message: string,
    readonly phase: "answers" | "teamStates" | "system",
  ) {
    super(message);
    this.name = "CompetitionResetError";
  }
}

/**
 * Full competition reset for testing. Deletes all answers, reinitializes every
 * teamState (keeps teamId/teamName/governorate), then replaces gameFlow + timer.
 * gameFlow/timer are updated only after answers and teamStates succeed.
 */
export async function resetCompetition(
  competitionId: string = MAIN_COMPETITION_ID,
): Promise<CompetitionResetResult> {
  const deletedAnswers = await deleteAllAnswers(competitionId);
  const resetTeamStates = await resetAllTeamStates(competitionId);

  // أرشفة اعتراضات المدربين في سجل المسابقة ثم تصفيتها (تعود إلى صفر للمسابقة الجديدة).
  // غير حرجة: لا تُفشل إعادة الضبط إذا تعذّرت.
  try {
    await archiveAndClearObjections();
  } catch {
    // تجاهل — استمر في إعادة الضبط.
  }

  try {
    await completeActiveSession();
    await clearActiveSessionLink();
    await Promise.all([
      setDoc(gameFlowRef, buildInitialGameFlowPayload()),
      setDoc(timerRef, buildInitialTimerPayload()),
    ]);
  } catch {
    throw new CompetitionResetError(
      "تعذر إعادة ضبط سير المسابقة أو المؤقت.",
      "system",
    );
  }

  return { deletedAnswers, resetTeamStates };
}

async function deleteAllAnswers(competitionId: string): Promise<number> {
  const snapshot = await getDocs(answersCollectionRef(competitionId));
  const refs = snapshot.docs.map((docSnap) => docSnap.ref);

  try {
    await commitBatchedDeletes(refs);
  } catch {
    throw new CompetitionResetError("تعذر حذف إجابات المسابقة.", "answers");
  }

  return refs.length;
}

async function resetAllTeamStates(competitionId: string): Promise<number> {
  const snapshot = await getDocs(teamStatesCollectionRef(competitionId));
  const docs = snapshot.docs;

  if (docs.length === 0) {
    return 0;
  }

  try {
    for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
      const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(getClientFirestore());

      chunk.forEach((docSnap) => {
        const data = docSnap.data();
        const teamId =
          typeof data.teamId === "string" ? data.teamId : docSnap.id;
        const teamName =
          typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم";
        const governorate =
          typeof data.governorate === "string" ? data.governorate : "غير محددة";

        batch.set(
          docSnap.ref,
          buildInitialTeamStateDocument(teamId, teamName, governorate),
        );
      });

      await batch.commit();
    }
  } catch {
    throw new CompetitionResetError(
      "تعذر إعادة ضبط حالات الفرق.",
      "teamStates",
    );
  }

  return docs.length;
}

/**
 * يحذف كل حالات الفرق (teamStates) — تُستخدم عند «بدء مسابقة جديدة» حتى لا يظهر أي
 * فريق في السير/التحكم حتى يعيد تسجيل الدخول فعلاً (تُعاد حالته عند الدخول).
 */
export async function deleteAllTeamStates(
  competitionId: string = MAIN_COMPETITION_ID,
): Promise<number> {
  const snapshot = await getDocs(teamStatesCollectionRef(competitionId));
  const refs = snapshot.docs.map((docSnap) => docSnap.ref);
  await commitBatchedDeletes(refs);
  return refs.length;
}

async function commitBatchedDeletes(refs: DocumentReference[]): Promise<void> {
  for (let index = 0; index < refs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = refs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

