import { markAnswersVisibleToAudience } from "@/features/competition/mark-answers-visible-to-audience";

/** @deprecated استخدم markAnswersVisibleToAudience("stage3", questionId) */
export async function markStage3AnswersVisibleToAudience(questionId: string) {
  await markAnswersVisibleToAudience("stage3", questionId);
}
