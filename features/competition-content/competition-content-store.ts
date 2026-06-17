import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { mergeCompetitionContent } from "@/features/competition-content/competition-content-merge";
import type { CompetitionContentDocument } from "@/features/competition-content/competition-content-types";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";

export const competitionContentRef = doc(
  getClientFirestore(),
  "competitions",
  MAIN_COMPETITION_ID,
  "system",
  "competitionContent",
);

export async function saveCompetitionContent(content: CompetitionContentDocument): Promise<void> {
  await setDoc(competitionContentRef, {
    ...content,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeCompetitionContent(
  onChange: (content: CompetitionContentDocument) => void,
  onError?: () => void,
): () => void {
  return subscribeFirestoreDoc(
    competitionContentRef,
    (snapshot) => {
      const data = snapshot.exists() ? (snapshot.data() as Partial<CompetitionContentDocument>) : null;
      onChange(mergeCompetitionContent(data));
    },
    () => {
      onChange(mergeCompetitionContent(null));
      onError?.();
    },
  );
}
