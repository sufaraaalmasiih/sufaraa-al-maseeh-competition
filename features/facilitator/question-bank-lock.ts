import { getDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import type { GameFlowStatus } from "@/types";

const IMPORT_ALLOWED_STATUSES: GameFlowStatus[] = ["waiting_players", "competition_intro"];

export async function assertQuestionBankImportAllowed(): Promise<void> {
  const snapshot = await getDoc(gameFlowRef);
  const status = snapshot.data()?.status;

  if (typeof status === "string" && !IMPORT_ALLOWED_STATUSES.includes(status as GameFlowStatus)) {
    throw new Error(
      "لا يمكن استيراد بنك أسئلة أثناء المسابقة. أوقف المسابقة أو أعد التعيين أولاً.",
    );
  }
}

export function isQuestionBankImportAllowedStatus(status: string | null | undefined): boolean {
  return typeof status === "string" && IMPORT_ALLOWED_STATUSES.includes(status as GameFlowStatus);
}
