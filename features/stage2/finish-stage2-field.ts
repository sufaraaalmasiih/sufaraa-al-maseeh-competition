import { serverTimestamp, updateDoc } from "firebase/firestore";
import { getStage2ProgressAfterFinish } from "@/features/stage2/stage2-progress";
import { isStage2FieldsComplete } from "@/features/stage2/stage2-field-sequence";
import { teamStateRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export async function finishStage2Field(
  teamId: string,
  currentFieldIndex: number,
): Promise<void> {
  if (isStage2FieldsComplete(currentFieldIndex)) {
    return;
  }

  const nextProgress = getStage2ProgressAfterFinish(currentFieldIndex);

  await updateDoc(teamStateRef(MAIN_COMPETITION_ID, teamId), {
    "progress.stage2FieldIndex": nextProgress.stage2FieldIndex,
    "progress.stage2Field": nextProgress.stage2Field,
    "progress.stage2QuestionIndex": nextProgress.stage2QuestionIndex,
    updatedAt: serverTimestamp(),
  });
}
