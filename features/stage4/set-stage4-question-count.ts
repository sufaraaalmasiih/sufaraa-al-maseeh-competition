import { fetchCurrentQuestionBankMeta } from "@/features/facilitator/question-bank-meta";
import {
  DEFAULT_QUESTION_DISPLAY_SETTINGS,
  parseQuestionDisplaySettings,
  writeQuestionDisplaySettings,
} from "@/features/facilitator/question-display-settings";

/** @deprecated Use writeQuestionDisplaySettings — kept for backward compatibility. */
export async function setStage4QuestionCount(questionCount: number) {
  const meta = await fetchCurrentQuestionBankMeta();
  const current = parseQuestionDisplaySettings(undefined, meta.bankSizes);
  const safeCount =
    meta.bankSizes.stage4 === 0
      ? 0
      : Math.max(1, Math.min(meta.bankSizes.stage4, Math.floor(questionCount)));

  await writeQuestionDisplaySettings({
    ...current,
    stage4: {
      ...current.stage4,
      displayCount: safeCount,
    },
  });
}

export { writeQuestionDisplaySettings, DEFAULT_QUESTION_DISPLAY_SETTINGS };
