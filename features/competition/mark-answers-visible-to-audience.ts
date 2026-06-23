import { getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { answersCollectionRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

/** يجعل إجابات سؤال معيّن مرئية للجمهور والفرق الأخرى بعد الإعلان. */
export async function markAnswersVisibleToAudience(
  stage: "stage3" | "stage4",
  questionId: string,
): Promise<void> {
  const answersSnapshot = await getDocs(
    query(
      answersCollectionRef(MAIN_COMPETITION_ID),
      where("stage", "==", stage),
      where("questionId", "==", questionId),
    ),
  );

  if (answersSnapshot.empty) {
    return;
  }

  const batch = writeBatch(getClientFirestore());

  for (const answerDoc of answersSnapshot.docs) {
    batch.update(answerDoc.ref, {
      visibleToAudience: true,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
