import { getDocFromServer, serverTimestamp, setDoc } from "firebase/firestore";
import { competitionSessionRef } from "@/firebase/firestore";
import {
  deleteAllTeamStates,
  resetCompetition,
  type CompetitionResetResult,
} from "@/features/gameflow/competition-reset";

export const COMPETITION_REAUTH_STORAGE_KEY = "competitionReauthEpoch";

export async function getCompetitionReauthEpoch(): Promise<number> {
  try {
    // من الخادم مباشرة (لا الكاش) حتى تطابق القيمةُ المختومة ما يراه الحارس،
    // فلا تحدث حلقة طرد متكررة بعد بدء مسابقة جديدة.
    const snapshot = await getDocFromServer(competitionSessionRef);
    const epoch = snapshot.data()?.reauthEpoch;
    return typeof epoch === "number" ? epoch : 0;
  } catch {
    // تعثّر الشبكة/القراءة يجب ألا يمنع تسجيل الدخول — عُد بصفر.
    return 0;
  }
}

export async function stampCompetitionReauthEpoch(): Promise<void> {
  // مقاوم للأخطاء بالكامل: لا يجوز أن يُفشِل تعثّرُ reauth عمليةَ تسجيل الدخول
  // (مثلاً sessionStorage يرمي في وضع التصفّح الخاص، أو تعثّر الشبكة).
  try {
    const epoch = await getCompetitionReauthEpoch();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(COMPETITION_REAUTH_STORAGE_KEY, String(epoch));
    }
  } catch {
    // تجاهل — الحارس سيختم القيمة لاحقاً عند توفّرها.
  }
}

export function readLocalCompetitionReauthEpoch(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const raw = sessionStorage.getItem(COMPETITION_REAUTH_STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function clearLocalCompetitionReauthEpoch(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(COMPETITION_REAUTH_STORAGE_KEY);
    } catch {
      // تجاهل — لا يؤثّر على المنطق.
    }
  }
}

/**
 * Full reset + bump reauth epoch so every team client signs out and must log in again.
 */
export async function startNewCompetition(): Promise<CompetitionResetResult> {
  const result = await resetCompetition();
  // الفرق لا تبقى ظاهرة في السير/التحكم بعد البدء الجديد — تُحذف حالاتها وتُعاد
  // تلقائياً عند تسجيل الفريق الدخول من جديد.
  await deleteAllTeamStates();
  await setDoc(
    competitionSessionRef,
    {
      reauthEpoch: Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return result;
}
