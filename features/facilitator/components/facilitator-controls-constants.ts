import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";

export const PLAYER_LABELS = [
  "اللاعب 1",
  "اللاعب 2",
  "اللاعب 3",
  "اللاعب 4",
  "اللاعب 5 (البديل)",
] as const;

export const STAGE3_QUESTION_OPTIONS = STAGE3_BOARD_FIELDS.flatMap((field) =>
  field.questions.map((question) => ({
    id: question.id,
    label: `${field.label} — ${question.difficultyLabel} (${question.id})`,
  })),
);

export function formatAnswerTime(ms: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleTimeString("ar", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
