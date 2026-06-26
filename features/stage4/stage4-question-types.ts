import type { Stage1QuestionType } from "@/features/stage1/stage1-types";

export type Stage4LegacyQuestionType = "link" | "image" | "who_am_i";

export type Stage4QuestionType = Stage1QuestionType | Stage4LegacyQuestionType;

export interface Stage4QuestionMetadata {
  id: string;
  type: Stage4QuestionType;
  typeLabel?: string;
  prompt: string;
  imageUrl?: string;
  reference?: string;
  clue?: string;
  linkText?: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  options?: string[];
  parts?: string[];
  correctOrder?: string[];
  /** تجاوز اختياري لنقاط الإجابة الصحيحة (بدل افتراضي المرحلة). */
  points?: number;
  order: number;
}

export function isStage4FlexibleType(
  type: Stage4QuestionType,
): type is Stage1QuestionType {
  return (
    type === "missing" ||
    type === "multiple_choice" ||
    type === "arrange" ||
    type === "fill_blank"
  );
}

export function getStage4QuestionTypeLabel(type: Stage4QuestionType): string {
  if (isStage4FlexibleType(type)) {
    const labels: Record<Stage1QuestionType, string> = {
      missing: "ماذا ينقص",
      fill_blank: "فراغات",
      multiple_choice: "اختر من متعدد",
      arrange: "رتّب",
    };
    return labels[type];
  }

  const legacyLabels: Record<Stage4LegacyQuestionType, string> = {
    link: "الرابط العجيب",
    image: "صورة",
    who_am_i: "من أنا",
  };

  return legacyLabels[type];
}
