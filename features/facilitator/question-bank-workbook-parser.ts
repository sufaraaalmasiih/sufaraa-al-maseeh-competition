import { parseStage1RowsToQuestions } from "@/features/facilitator/stage1-question-bank-parser";
import { deriveWorkbookBankStats } from "@/features/facilitator/question-bank-meta";
import type {
  FullQuestionBankPayload,
  Stage2QuestionBank,
  Stage3BankQuestion,
} from "@/features/facilitator/question-bank-types";
import {
  STAGE3_FIELD_KEYS,
  STAGE3_FIELD_LABELS,
  STAGE3_LEVEL_LABELS,
  STAGE3_LEVELS,
  normalizeStage1ExcelType,
  normalizeStage2ExcelType,
  normalizeStage3ExcelType,
  normalizeStage4ExcelType,
  type AllGameQuestionType,
} from "@/features/facilitator/question-type-registry";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";
import type { Stage2MatchingPair } from "@/features/stage2/stage2-matching-types";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";
import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function splitPipeList(value: unknown): string[] {
  const text = trim(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[|,;،\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function collectOptions(row: Record<string, unknown>): string[] {
  return [row.option1, row.option2, row.option3, row.option4].map(trim).filter(Boolean);
}

function normalizeStage3Field(value: unknown): (typeof STAGE3_FIELD_KEYS)[number] | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }
  const compact = raw.replace(/\s+/g, "");
  const byKey = STAGE3_FIELD_KEYS.find((key) => key === raw || key === compact);
  if (byKey) {
    return byKey;
  }
  return (
    STAGE3_FIELD_KEYS.find(
      (key) =>
        STAGE3_FIELD_LABELS[key] === raw || STAGE3_FIELD_LABELS[key].replace(/\s+/g, "") === compact,
    ) ?? null
  );
}

function normalizeStage3Level(value: unknown): Stage3Difficulty | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }
  const compact = raw.replace(/\s+/g, "");
  const byKey = STAGE3_LEVELS.find((level) => level === raw || level === compact);
  if (byKey) {
    return byKey;
  }
  return (
    STAGE3_LEVELS.find(
      (level) =>
        STAGE3_LEVEL_LABELS[level] === raw ||
        STAGE3_LEVEL_LABELS[level].replace(/\s+/g, "") === compact,
    ) ?? null
  );
}

function unifiedRowToLegacyStage1Row(row: Record<string, unknown>): Record<string, unknown> {
  const type = normalizeStage1ExcelType(row.type ?? row.typename);
  const options = collectOptions(row);
  const dataParts = splitPipeList(row.data);

  return {
    id: row.id,
    type: type ?? row.type,
    prompt: row.question ?? row.prompt,
    reference: row.reference ?? "",
    correctAnswer: row.correct ?? row.correctanswer ?? row.answer,
    options: options.length > 0 ? options.join("|") : row.options,
    parts:
      dataParts.length > 0
        ? dataParts.join("|")
        : type === "arrange" && options.length > 0
          ? options.join("|")
          : row.parts,
    correctOrder: row.correctorder ?? row.data,
    imageUrl: row.imageurl ?? row.image,
  };
}

function buildStage3Question(row: Record<string, unknown>): Stage3BankQuestion | null {
  const type = normalizeStage3ExcelType(row.type ?? row.typename);
  const fieldId = normalizeStage3Field(row.category);
  const difficulty = normalizeStage3Level(row.level);
  const id = trim(row.id);
  const prompt = trim(row.question) || trim(row.prompt);

  if (!type || !fieldId || !difficulty || !id || !prompt) {
    return null;
  }

  const base = buildFlexibleQuestion(row, type, id, prompt);
  if (!base) {
    return null;
  }

  const fieldLabel = STAGE3_FIELD_LABELS[fieldId];
  const numberMatch = id.match(/_q(\d+)$/);
  const questionNumber = numberMatch ? Number(numberMatch[1]) : 1;

  return {
    ...base,
    fieldId,
    fieldLabel,
    difficulty,
    questionNumber,
  };
}

function buildStage4Question(row: Record<string, unknown>, order: number): Stage4QuestionMetadata | null {
  const type = normalizeStage4ExcelType(row.type ?? row.typename);
  const id = trim(row.id);
  const prompt = trim(row.question) || trim(row.prompt);
  const correctAnswer = trim(row.correct) || trim(row.correctanswer);

  if (!type || !id || !prompt || !correctAnswer) {
    return null;
  }

  const question: Stage4QuestionMetadata = {
    id,
    type: type as Stage4QuestionMetadata["type"],
    prompt,
    correctAnswer,
    order,
  };

  const imageUrl = trim(row.imageurl) || trim(row.image);
  if (imageUrl) {
    question.imageUrl = imageUrl;
  }

  const reference = trim(row.reference);
  if (reference) {
    question.reference = reference;
  }

  const data = trim(row.data);
  if (type === "link" && data) {
    question.linkText = data;
  }
  if (type === "who_am_i" && data) {
    question.clue = data;
  }

  const accepted = splitPipeList(row.acceptedanswers);
  if (accepted.length > 0) {
    question.acceptedAnswers = accepted;
  }

  if (type === "multiple_choice") {
    const options = collectOptions(row);
    if (options.length >= 2) {
      question.options = options;
    }
  }

  if (type === "arrange") {
    const parts = splitPipeList(row.data);
    if (parts.length >= 2) {
      question.parts = parts;
    }
  }

  return question;
}

function buildFlexibleQuestion(
  row: Record<string, unknown>,
  type: AllGameQuestionType,
  id: string,
  prompt: string,
): Stage1MockQuestion | null {
  const reference = trim(row.reference) || undefined;
  const imageUrl = trim(row.imageurl) || trim(row.image) || undefined;
  const correctAnswer = trim(row.correct) || trim(row.correctanswer);

  if (type === "multiple_choice") {
    const options = collectOptions(row);
    if (options.length < 2 || !correctAnswer) {
      return null;
    }
    return { id, type: "multiple_choice", prompt, reference, imageUrl, correctAnswer, options };
  }

  if (type === "arrange" || type === "arrangeVerse") {
    const parts = splitPipeList(row.data);
    const options = collectOptions(row);
    const resolvedParts = parts.length >= 2 ? parts : options;
    if (resolvedParts.length < 2) {
      return null;
    }
    return {
      id,
      type: "arrange",
      prompt,
      reference,
      imageUrl,
      correctAnswer: correctAnswer || resolvedParts.join(" | "),
      parts: resolvedParts,
    };
  }

  if (type === "missing" || type === "fill_blank") {
    if (!correctAnswer) {
      return null;
    }
    return { id, type, prompt, reference, imageUrl, correctAnswer };
  }

  if (type === "matching" || type === "completeVerse" || type === "trueFalseCorrect") {
    if (!correctAnswer) {
      return null;
    }
    return {
      id,
      type: "fill_blank",
      prompt,
      reference,
      imageUrl,
      correctAnswer,
    };
  }

  if (type === "link" || type === "who_am_i" || type === "image") {
    if (!correctAnswer) {
      return null;
    }
    return {
      id,
      type: type === "link" ? "fill_blank" : "missing",
      prompt,
      reference,
      imageUrl,
      correctAnswer,
    };
  }

  return null;
}

function matchingGroupKey(id: string): string {
  return id.replace(/-\d+$/, "");
}

function buildStage2Bank(rows: Record<string, unknown>[]): Stage2QuestionBank {
  const matchingGroups = new Map<string, { rows: Record<string, unknown>[]; reference: string }>();
  const arrangeVerse: Stage2ArrangeVerseQuestion[] = [];
  const completeVerse: Stage2CompleteVerseQuestion[] = [];
  const trueFalseCorrect: Stage2TrueFalseCorrectQuestion[] = [];

  rows.forEach((row) => {
    const type = normalizeStage2ExcelType(row.type ?? row.typename);
    const id = trim(row.id);
    const prompt = trim(row.question) || trim(row.prompt);
    const reference = trim(row.reference) || trim(row.notes) || "";
    const correctAnswer = trim(row.correct) || trim(row.correctanswer);

    if (!type || !id) {
      return;
    }

    if (type === "matching") {
      const key = matchingGroupKey(id);
      const group = matchingGroups.get(key) ?? { rows: [], reference };
      group.rows.push(row);
      if (reference) {
        group.reference = reference;
      }
      matchingGroups.set(key, group);
      return;
    }

    if (type === "arrangeVerse") {
      const fragments = splitPipeList(row.data);
      const correctOrder = splitPipeList(row.correct) || fragments;
      if (fragments.length >= 2) {
        arrangeVerse.push({
          id,
          prompt: prompt || "رتّب أجزاء الآية",
          fragments,
          correctOrder,
          reference,
          imageUrl: trim(row.imageurl) || trim(row.image) || undefined,
        });
      }
      return;
    }

    if (type === "completeVerse") {
      if (prompt && correctAnswer) {
        completeVerse.push({
          id,
          prompt,
          verseWithBlank: trim(row.data) || prompt,
          correctAnswer,
          reference,
          imageUrl: trim(row.imageurl) || trim(row.image) || undefined,
        });
      }
      return;
    }

    if (type === "trueFalseCorrect") {
      const normalized = correctAnswer.toLowerCase();
      trueFalseCorrect.push({
        id,
        statement: prompt,
        correctIsTrue: normalized === "صح" || normalized === "true",
        expectedCorrection: trim(row.data) || undefined,
        reference,
        imageUrl: trim(row.imageurl) || trim(row.image) || undefined,
      });
    }
  });

  const matching: Stage2MatchingQuestion[] = [];

  matchingGroups.forEach((group, key) => {
    const pairs: Stage2MatchingPair[] = [];
    const rightOptions = new Set<string>();

    group.rows.forEach((row) => {
      const left = trim(row.question) || trim(row.prompt);
      const correctRight = trim(row.correct) || trim(row.correctanswer);
      const options = collectOptions(row);
      options.forEach((option) => rightOptions.add(option));
      if (correctRight) {
        rightOptions.add(correctRight);
      }
      if (left && correctRight) {
        pairs.push({ left, correctRight });
      }
    });

    if (pairs.length > 0) {
      matching.push({
        id: key,
        prompt: "وصّل كل عبارة بما يناسبها",
        reference: group.reference,
        pairs,
        rightOptions: [...rightOptions],
      });
    }
  });

  return { matching, arrangeVerse, completeVerse, trueFalseCorrect };
}

export function parseWorkbookRowsToBank(rows: Record<string, unknown>[]): FullQuestionBankPayload {
  const stage1Rows = rows.filter((row) => trim(row.stage).toLowerCase() === "stage1");
  const stage2Rows = rows.filter((row) => trim(row.stage).toLowerCase() === "stage2");
  const stage3Rows = rows.filter((row) => trim(row.stage).toLowerCase() === "stage3");
  const stage4Rows = rows.filter((row) => trim(row.stage).toLowerCase() === "stage4");

  const stage1 = parseStage1RowsToQuestions(stage1Rows.map(unifiedRowToLegacyStage1Row));

  const stage3: Record<string, Stage3BankQuestion> = {};
  stage3Rows.forEach((row) => {
    const question = buildStage3Question(row);
    if (question) {
      stage3[question.id] = question;
    }
  });

  const stage4: Stage4QuestionMetadata[] = [];
  stage4Rows.forEach((row, index) => {
    const question = buildStage4Question(row, index + 1);
    if (question) {
      stage4.push(question);
    }
  });

  return {
    stage1,
    stage2: buildStage2Bank(stage2Rows),
    stage3,
    stage4,
    meta: deriveWorkbookBankStats(rows),
  };
}

export function countStage2Questions(stage2: Stage2QuestionBank): number {
  return (
    stage2.matching.length +
    stage2.arrangeVerse.length +
    stage2.completeVerse.length +
    stage2.trueFalseCorrect.length
  );
}

export function buildArchiveCounts(payload: FullQuestionBankPayload) {
  return {
    stage1: payload.stage1.length,
    stage2: countStage2Questions(payload.stage2),
    stage3: Object.keys(payload.stage3).length,
    stage4: payload.stage4.length,
    total:
      payload.stage1.length +
      countStage2Questions(payload.stage2) +
      Object.keys(payload.stage3).length +
      payload.stage4.length,
  };
}
