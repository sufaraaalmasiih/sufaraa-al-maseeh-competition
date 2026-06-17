import { stage1MockQuestions } from "@/features/stage1/stage1-mock-questions";
import { stage2ArrangeVerseMockQuestions } from "@/features/stage2/stage2-arrange-verse-mock-questions";
import { stage2CompleteVerseMockQuestions } from "@/features/stage2/stage2-complete-verse-mock-questions";
import { stage2MatchingMockQuestions } from "@/features/stage2/stage2-matching-mock-questions";
import { stage2TrueFalseCorrectMockQuestions } from "@/features/stage2/stage2-true-false-correct-mock-questions";
import { STAGE3_BOARD_FIELD_DEFINITIONS, STAGE3_FIELD_DIFFICULTY_SEQUENCE } from "@/features/stage3/stage3-board-data";
import { getStage4MockQuestions } from "@/features/stage4/stage4-mock-questions";
import {
  ALL_GAME_QUESTION_TYPES,
  STAGE1_TYPE_LABELS,
  STAGE2_TYPE_LABELS,
  STAGE3_FIELD_LABELS,
  STAGE3_LEVEL_LABELS,
  STAGE3_TYPE_LABELS,
  STAGE4_TYPE_LABELS,
  type Stage1ExcelType,
  type Stage2ExcelType,
  type AllGameQuestionType,
} from "@/features/facilitator/question-type-registry";

const COL_COUNT = 20;

function blankRow(): string[] {
  return Array.from({ length: COL_COUNT }, () => "");
}

function joinParts(parts: string[]): string {
  return parts.join(" | ");
}

export function buildStage1CanonicalRows(): string[][] {
  return stage1MockQuestions.map((question) => {
    const row = blankRow();
    row[0] = question.id;
    row[1] = "stage1";
    row[2] = "المرحلة الأولى - اجمعوا الكنوز";
    row[3] = STAGE1_TYPE_LABELS[question.type as Stage1ExcelType];
    row[4] = STAGE1_TYPE_LABELS[question.type as Stage1ExcelType];
    row[7] = question.prompt;
    row[13] = question.correctAnswer;
    if (question.type === "multiple_choice" && "options" in question) {
      row[9] = question.options[0] ?? "";
      row[10] = question.options[1] ?? "";
      row[11] = question.options[2] ?? "";
      row[12] = question.options[3] ?? "";
    }
    if (question.type === "arrange" && "parts" in question) {
      row[8] = joinParts(question.parts);
    }
    if (question.reference) {
      row[19] = question.reference;
    }
    row[15] = "5";
    return row;
  });
}

export function buildStage2CanonicalRows(): string[][] {
  const rows: string[][] = [];

  stage2MatchingMockQuestions.forEach((question) => {
    question.pairs.forEach((pair, index) => {
      const row = blankRow();
      row[0] = `${question.id}-${index + 1}`;
      row[1] = "stage2";
      row[2] = "المرحلة الثانية - فتشوا الكتب";
      row[3] = STAGE2_TYPE_LABELS.matching;
      row[4] = STAGE2_TYPE_LABELS.matching;
      row[7] = pair.left;
      row[9] = question.rightOptions[0] ?? "";
      row[10] = question.rightOptions[1] ?? "";
      row[11] = question.rightOptions[2] ?? "";
      row[12] = question.rightOptions[3] ?? "";
      row[13] = pair.correctRight;
      row[19] = question.reference;
      row[15] = "15";
      rows.push(row);
    });
  });

  stage2ArrangeVerseMockQuestions.forEach((question) => {
    const row = blankRow();
    row[0] = question.id;
    row[1] = "stage2";
    row[2] = "المرحلة الثانية - فتشوا الكتب";
    row[3] = STAGE2_TYPE_LABELS.arrangeVerse;
    row[4] = STAGE2_TYPE_LABELS.arrangeVerse;
    row[7] = question.prompt;
    row[8] = joinParts(question.fragments);
    row[13] = joinParts(question.correctOrder);
    row[19] = question.reference;
    row[15] = "15";
    rows.push(row);
  });

  stage2CompleteVerseMockQuestions.forEach((question) => {
    const row = blankRow();
    row[0] = question.id;
    row[1] = "stage2";
    row[2] = "المرحلة الثانية - فتشوا الكتب";
    row[3] = STAGE2_TYPE_LABELS.completeVerse;
    row[4] = STAGE2_TYPE_LABELS.completeVerse;
    row[7] = question.prompt;
    row[8] = question.verseWithBlank;
    row[13] = question.correctAnswer;
    row[19] = question.reference;
    row[15] = "15";
    rows.push(row);
  });

  stage2TrueFalseCorrectMockQuestions.forEach((question) => {
    const row = blankRow();
    row[0] = question.id;
    row[1] = "stage2";
    row[2] = "المرحلة الثانية - فتشوا الكتب";
    row[3] = STAGE2_TYPE_LABELS.trueFalseCorrect;
    row[4] = STAGE2_TYPE_LABELS.trueFalseCorrect;
    row[7] = question.statement;
    row[9] = "صح";
    row[10] = "خطأ";
    row[13] = question.correctIsTrue ? "صح" : "خطأ";
    row[8] = question.expectedCorrection ?? "";
    row[19] = question.reference;
    row[15] = "15";
    rows.push(row);
  });

  return rows;
}

function fillRowForType(row: string[], type: AllGameQuestionType) {
  if (type === "multiple_choice") {
    row[9] = "أ";
    row[10] = "ب";
    row[11] = "ج";
    row[12] = "د";
    row[13] = "أ";
    return;
  }
  if (type === "arrange" || type === "arrangeVerse") {
    row[8] = "الله | محبة | العالم";
    row[13] = "الله | محبة | العالم";
    return;
  }
  if (type === "matching") {
    row[7] = "موسى";
    row[9] = "العصا";
    row[10] = "البحر";
    row[11] = "الجبل";
    row[12] = "الصحراء";
    row[13] = "العصا";
    return;
  }
  if (type === "trueFalseCorrect") {
    row[9] = "صح";
    row[10] = "خطأ";
    row[13] = "صح";
    return;
  }
  if (type === "completeVerse") {
    row[8] = "الرب راعيّ فلا ___ شيء";
    row[13] = "يعوزني";
    return;
  }
  if (type === "link") {
    row[8] = "موسى | العصا | البحر";
    row[13] = "الخروج من مصر";
    return;
  }
  if (type === "who_am_i") {
    row[8] = "أنا تلميذٌ أنكرْتُ معلّمي ثلاث مرات";
    row[13] = "بطرس";
    return;
  }
  if (type === "image") {
    row[16] = "/images/stage4/olive-branch.svg";
    row[13] = "سلام";
    return;
  }
  if (type === "missing") {
    row[13] = "الإيمان";
    return;
  }
  if (type === "fill_blank") {
    row[13] = "الخلاص";
  }
}

export function buildStage3CanonicalRows(): string[][] {
  const rows: string[][] = [];

  STAGE3_BOARD_FIELD_DEFINITIONS.forEach((field) => {
    STAGE3_FIELD_DIFFICULTY_SEQUENCE.forEach((difficulty, index) => {
      const row = blankRow();
      const number = index + 1;
      const type = ALL_GAME_QUESTION_TYPES[(number - 1) % ALL_GAME_QUESTION_TYPES.length];
      row[0] = `${field.key}_q${number}`;
      row[1] = "stage3";
      row[2] = "المرحلة الثالثة - على المحك";
      row[3] = STAGE3_TYPE_LABELS[type];
      row[4] = STAGE3_TYPE_LABELS[type];
      row[5] = STAGE3_FIELD_LABELS[field.key];
      row[6] = STAGE3_LEVEL_LABELS[difficulty];
      row[7] = `(${STAGE3_FIELD_LABELS[field.key]}) سؤال ${number}`;
      fillRowForType(row, type);
      row[15] = String(difficulty === "easy" ? 15 : difficulty === "medium" ? 30 : 45);
      rows.push(row);
    });
  });

  return rows;
}

export function buildStage4CanonicalRows(): string[][] {
  return getStage4MockQuestions().map((question) => {
    const row = blankRow();
    row[0] = question.id;
    row[1] = "stage4";
    row[2] = "المرحلة الرابعة - اثبتوا بالحق";
    row[3] = STAGE4_TYPE_LABELS[question.type];
    row[4] = STAGE4_TYPE_LABELS[question.type];
    row[7] = question.prompt;
    row[13] = question.correctAnswer;
    if (question.type === "multiple_choice" && question.options) {
      row[9] = question.options[0] ?? "";
      row[10] = question.options[1] ?? "";
      row[11] = question.options[2] ?? "";
      row[12] = question.options[3] ?? "";
    }
    if (question.type === "arrange" && question.parts) {
      row[8] = joinParts(question.parts);
    }
    if (question.type === "link" && question.linkText) {
      row[8] = question.linkText;
    }
    if (question.type === "who_am_i" && question.clue) {
      row[8] = question.clue;
    }
    if (question.imageUrl) {
      row[16] = question.imageUrl;
    }
    if (question.acceptedAnswers?.length) {
      row[14] = question.acceptedAnswers.join(" | ");
    }
    row[15] = "10";
    return row;
  });
}

export function buildAllQuestionsCanonicalRows(): string[][] {
  return [
    ...buildStage1CanonicalRows(),
    ...buildStage2CanonicalRows(),
    ...buildStage3CanonicalRows(),
    ...buildStage4CanonicalRows(),
  ];
}
