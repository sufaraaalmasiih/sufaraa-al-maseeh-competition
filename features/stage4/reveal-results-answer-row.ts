import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";
import type { Stage4ActiveAnswerRow } from "@/features/stage4/use-stage4-active-answers";

export type RevealResultsAnswerRow = Stage4ActiveAnswerRow & {
  outcome?: Stage3AnswerOutcome;
};
