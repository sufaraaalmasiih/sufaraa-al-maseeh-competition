import type { Stage2QuestionBank, Stage3BankQuestion } from "@/features/facilitator/question-bank-types";
import {
  sanitizeStage2BankForTeam,
  sanitizeStage3BankForTeam,
  sanitizeStage4BankForTeam,
} from "@/lib/sanitize-question-bank";
import { stage2ArrangeVerseMockQuestions } from "@/features/stage2/stage2-arrange-verse-mock-questions";
import { stage2CompleteVerseMockQuestions } from "@/features/stage2/stage2-complete-verse-mock-questions";
import { stage2MatchingMockQuestions } from "@/features/stage2/stage2-matching-mock-questions";
import { stage2TrueFalseCorrectMockQuestions } from "@/features/stage2/stage2-true-false-correct-mock-questions";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

const DEFAULT_STAGE2: Stage2QuestionBank = {
  matching: stage2MatchingMockQuestions,
  arrangeVerse: stage2ArrangeVerseMockQuestions,
  completeVerse: stage2CompleteVerseMockQuestions,
  trueFalseCorrect: stage2TrueFalseCorrectMockQuestions,
};

let stage2Raw: Stage2QuestionBank | null = null;
let stage3Raw: Record<string, Stage3BankQuestion> | null = null;
let stage4Raw: Stage4QuestionMetadata[] | null = null;
let sanitizeForTeamPlayback = false;

export function setQuestionBankSanitizeForTeamPlayback(enabled: boolean): void {
  sanitizeForTeamPlayback = enabled;
}

function resolveStage2Bank(): Stage2QuestionBank {
  return stage2Raw ?? DEFAULT_STAGE2;
}

function maybeSanitizeStage2(bank: Stage2QuestionBank): Stage2QuestionBank {
  return sanitizeForTeamPlayback ? sanitizeStage2BankForTeam(bank) : bank;
}

function maybeSanitizeStage3(
  bank: Record<string, Stage3BankQuestion>,
): Record<string, Stage3BankQuestion> {
  return sanitizeForTeamPlayback ? sanitizeStage3BankForTeam(bank) : bank;
}

function maybeSanitizeStage4(questions: Stage4QuestionMetadata[]): Stage4QuestionMetadata[] {
  return sanitizeForTeamPlayback ? sanitizeStage4BankForTeam(questions) : questions;
}

export function setRuntimeStage2Bank(bank: Stage2QuestionBank | null) {
  stage2Raw = bank;
}

export function setRuntimeStage3Bank(bank: Record<string, Stage3BankQuestion> | null) {
  stage3Raw = bank;
}

export function setRuntimeStage4Bank(bank: Stage4QuestionMetadata[] | null) {
  stage4Raw = bank;
}

export function getActiveStage2Bank(): Stage2QuestionBank {
  return maybeSanitizeStage2(resolveStage2Bank());
}

export function getAuthoritativeStage2Bank(): Stage2QuestionBank {
  return resolveStage2Bank();
}

export function getActiveStage2MatchingQuestions(): Stage2MatchingQuestion[] {
  const bank = getActiveStage2Bank();
  return bank.matching.length > 0 ? bank.matching : maybeSanitizeStage2(DEFAULT_STAGE2).matching;
}

export function getAuthoritativeStage2MatchingQuestion(
  questionId: string,
): Stage2MatchingQuestion | null {
  const bank = getAuthoritativeStage2Bank();
  const questions = bank.matching.length > 0 ? bank.matching : DEFAULT_STAGE2.matching;
  return questions.find((question) => question.id === questionId) ?? null;
}

export function getActiveStage2ArrangeVerseQuestions(): Stage2ArrangeVerseQuestion[] {
  const bank = getActiveStage2Bank();
  return bank.arrangeVerse.length > 0 ? bank.arrangeVerse : maybeSanitizeStage2(DEFAULT_STAGE2).arrangeVerse;
}

export function getAuthoritativeStage2ArrangeVerseQuestion(
  questionId: string,
): Stage2ArrangeVerseQuestion | null {
  const bank = getAuthoritativeStage2Bank();
  const questions = bank.arrangeVerse.length > 0 ? bank.arrangeVerse : DEFAULT_STAGE2.arrangeVerse;
  return questions.find((question) => question.id === questionId) ?? null;
}

export function getActiveStage2CompleteVerseQuestions(): Stage2CompleteVerseQuestion[] {
  const bank = getActiveStage2Bank();
  return bank.completeVerse.length > 0 ? bank.completeVerse : maybeSanitizeStage2(DEFAULT_STAGE2).completeVerse;
}

export function getAuthoritativeStage2CompleteVerseQuestion(
  questionId: string,
): Stage2CompleteVerseQuestion | null {
  const bank = getAuthoritativeStage2Bank();
  const questions =
    bank.completeVerse.length > 0 ? bank.completeVerse : DEFAULT_STAGE2.completeVerse;
  return questions.find((question) => question.id === questionId) ?? null;
}

export function getActiveStage2TrueFalseQuestions(): Stage2TrueFalseCorrectQuestion[] {
  const bank = getActiveStage2Bank();
  return bank.trueFalseCorrect.length > 0
    ? bank.trueFalseCorrect
    : maybeSanitizeStage2(DEFAULT_STAGE2).trueFalseCorrect;
}

export function getAuthoritativeStage2TrueFalseQuestion(
  questionId: string,
): Stage2TrueFalseCorrectQuestion | null {
  const bank = getAuthoritativeStage2Bank();
  const questions =
    bank.trueFalseCorrect.length > 0 ? bank.trueFalseCorrect : DEFAULT_STAGE2.trueFalseCorrect;
  return questions.find((question) => question.id === questionId) ?? null;
}

export function getRuntimeStage3Question(questionId: string): Stage3BankQuestion | null {
  if (!stage3Raw) {
    return null;
  }
  const question = stage3Raw[questionId];
  if (!question) {
    return null;
  }
  return sanitizeForTeamPlayback
    ? maybeSanitizeStage3({ [questionId]: question })[questionId]
    : question;
}

export function getAuthoritativeRuntimeStage3Question(
  questionId: string,
): Stage3BankQuestion | null {
  return stage3Raw?.[questionId] ?? null;
}

export function getRuntimeStage4Bank(): Stage4QuestionMetadata[] | null {
  if (!stage4Raw) {
    return null;
  }
  return maybeSanitizeStage4(stage4Raw);
}

export function getActiveStage4Questions(): Stage4QuestionMetadata[] {
  const bank = stage4Raw && stage4Raw.length > 0 ? maybeSanitizeStage4(stage4Raw) : [];
  return bank;
}

export function getActiveStage4QuestionByIndex(index: number): Stage4QuestionMetadata | null {
  const bank = stage4Raw && stage4Raw.length > 0 ? maybeSanitizeStage4(stage4Raw) : [];
  return bank[index] ?? null;
}

export function getActiveStage4Question(id: string): Stage4QuestionMetadata | null {
  return stage4Raw?.find((question) => question.id === id)
    ? maybeSanitizeStage4(stage4Raw).find((question) => question.id === id) ?? null
    : null;
}

export function getAuthoritativeStage4Question(id: string): Stage4QuestionMetadata | null {
  return stage4Raw?.find((question) => question.id === id) ?? null;
}
