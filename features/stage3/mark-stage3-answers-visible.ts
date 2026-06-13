import { getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { answersCollectionRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export async function markStage3AnswersVisibleToAudience(questionId: string) {
  const answersSnapshot = await getDocs(
    query(
      answersCollectionRef(MAIN_COMPETITION_ID),
      where("stage", "==", "stage3"),
      where("questionId", "==", questionId),
    ),
  );

  if (answersSnapshot.empty) {
    return;
  }

  const batch = writeBatch(firestore);

  for (const answerDoc of answersSnapshot.docs) {
    batch.update(answerDoc.ref, {
      visibleToAudience: true,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
