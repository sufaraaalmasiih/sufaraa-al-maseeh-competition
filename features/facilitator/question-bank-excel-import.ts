import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import type { Stage1MockQuestion, Stage1QuestionType } from "@/features/stage1/stage1-types";
import { parseStage1RowsToQuestions } from "@/features/facilitator/stage1-question-bank-parser";
import {
  deriveWorkbookBankStats,
  type WorkbookBankStats,
} from "@/features/facilitator/question-bank-meta";
import {
  validateQuestionBankRows,
  type WorkbookValidationReport,
} from "@/features/facilitator/question-bank-workbook-validation";
import type { FullQuestionBankPayload } from "@/features/facilitator/question-bank-types";
import { parseWorkbookRowsToBank } from "@/features/facilitator/question-bank-workbook-parser";
import { normalizeStage1ExcelType } from "@/features/facilitator/question-type-registry";

export const QUESTION_BANK_TEMPLATE_FILENAME = "sufaraa-questions-template.xlsx";
export const QUESTION_BANK_TEMPLATE_URL = `/templates/${QUESTION_BANK_TEMPLATE_FILENAME}`;

export const EASY_BIBLE_QUESTION_BANK_FILENAME = "sufaraa-easy-bible-questions.xlsx";
export const EASY_BIBLE_QUESTION_BANK_URL = `/templates/${EASY_BIBLE_QUESTION_BANK_FILENAME}`;

export const BIBLE_BANK_FILENAME = "sufaraa-bible-bank.xlsx";
export const BIBLE_BANK_URL = `/templates/${BIBLE_BANK_FILENAME}`;

const EXCLUDED_SHEETS = new Set([
  "readme",
  "lists",
  "bank_config",
  "bank config",
  "قراءة_م2",
  "قراءة م2",
  "stage2_reading",
  "stage2 reading",
  "القوائم",
  "شرح",
  "examples",
  "example",
  "أمثلة",
  "امثلة",
  "instructions",
  "تعليمات",
]);

const STAGE2_READING_SHEET_NAMES = new Set([
  "قراءة_م2",
  "قراءة م2",
  "stage2_reading",
  "stage2 reading",
  "قراءة المرحلة الثانية",
]);

const MASTER_SHEET_NAMES = new Set([
  "all_questions",
  "all questions",
  "كل_الأسئلة",
  "كل الأسئلة",
]);

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeHeader(value: unknown): string {
  return trim(value).replace(/\s+/g, "").toLowerCase();
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

function mapUnifiedStage1Type(type: unknown): Stage1QuestionType | null {
  const excelType = normalizeStage1ExcelType(type ?? "");
  return excelType ?? null;
}

export function findQuestionHeaderRowIndex(rows: unknown[][]): number {
  const byEnglish = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return (
      headers.includes("id") &&
      headers.includes("stage") &&
      headers.includes("type") &&
      (headers.includes("question") || headers.includes("prompt"))
    );
  });
  if (byEnglish >= 0) {
    return byEnglish;
  }

  return rows.findIndex((row) => {
    const joined = row.map((cell) => trim(cell)).join("|");
    return /السؤال/.test(joined) && /المرحلة/.test(joined) && /نوع/.test(joined);
  });
}

export function readQuestionBankSheetRows(sheet: WorkSheet): Record<string, unknown>[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
  if (raw.length === 0) {
    return [];
  }

  const headerIndex = findQuestionHeaderRowIndex(raw);
  if (headerIndex < 0) {
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  }

  const headers = raw[headerIndex].map(normalizeHeader);
  return raw
    .slice(headerIndex + 1)
    .map((row) => {
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        if (header) {
          record[header] = row[index];
        }
      });
      return record;
    })
    .filter((row) => trim(row.question) || trim(row.prompt) || trim(row.correct) || trim(row.stage));
}

function unifiedRowToLegacyStage1Row(row: Record<string, unknown>): Record<string, unknown> {
  const type = mapUnifiedStage1Type(row.type ?? row.typename);
  const options = [row.option1, row.option2, row.option3, row.option4]
    .map(trim)
    .filter(Boolean);
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

export function parseUnifiedRowsToStage1Questions(
  rows: Record<string, unknown>[],
): Stage1MockQuestion[] {
  const stage1Rows = rows
    .filter((row) => trim(row.stage).toLowerCase() === "stage1")
    .map(unifiedRowToLegacyStage1Row);

  if (stage1Rows.length > 0) {
    return parseStage1RowsToQuestions(stage1Rows);
  }

  return parseStage1RowsToQuestions(rows.map(unifiedRowToLegacyStage1Row));
}

export function resolveQuestionBankSheetNames(sheetNames: string[]): string[] {
  const master = sheetNames.find((name) => MASTER_SHEET_NAMES.has(name.trim().toLowerCase()));
  if (master) {
    return [master];
  }

  const stage1 = sheetNames.find((name) => name.trim().toLowerCase() === "stage1");
  if (stage1) {
    return [stage1];
  }

  return sheetNames.filter((name) => !EXCLUDED_SHEETS.has(name.trim().toLowerCase()));
}

export interface Stage2ReadingConfig {
  reference: string;
  passagePreview: string;
}

function readKeyValueSheetRows(sheet: WorkSheet): Record<string, string> {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const map: Record<string, string> = {};

  raw.forEach((row) => {
    const field = normalizeHeader(row[1]);
    const value = trim(row[2]);
    if (field && value) {
      map[field] = value;
    }
  });

  return map;
}

export function parseStage2ReadingFromWorkbook(workbook: XLSX.WorkBook): Stage2ReadingConfig {
  const sheetName = workbook.SheetNames.find((name) =>
    STAGE2_READING_SHEET_NAMES.has(name.trim().toLowerCase()),
  );

  if (!sheetName) {
    return { reference: "", passagePreview: "" };
  }

  const map = readKeyValueSheetRows(workbook.Sheets[sheetName]);
  return {
    reference: map.reference ?? map["المرجع"] ?? "",
    passagePreview: map.passagepreview ?? map.passage ?? map["نصالمقطع"] ?? "",
  };
}

async function downloadTemplateFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("template not found");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadQuestionBankTemplate(): Promise<void> {
  await downloadTemplateFile(QUESTION_BANK_TEMPLATE_URL, QUESTION_BANK_TEMPLATE_FILENAME);
}

export async function downloadEasyBibleQuestionBank(): Promise<void> {
  await downloadTemplateFile(EASY_BIBLE_QUESTION_BANK_URL, EASY_BIBLE_QUESTION_BANK_FILENAME);
}

/** بنك أسئلة جاهز ومملوء من الكتاب المقدس (150 سؤالاً) — جاهز للرفع مباشرة. */
export async function downloadReadyBibleBank(): Promise<void> {
  await downloadTemplateFile(BIBLE_BANK_URL, BIBLE_BANK_FILENAME);
}

export async function parseQuestionBankWorkbookFile(file: ArrayBuffer): Promise<{
  payload: FullQuestionBankPayload | null;
  sheetName: string;
  totalRows: number;
  bankStats: WorkbookBankStats;
  validation: WorkbookValidationReport;
}> {
  const workbook = XLSX.read(file, { type: "array" });
  const masterSheet = workbook.SheetNames.find((name) =>
    MASTER_SHEET_NAMES.has(name.trim().toLowerCase()),
  );
  const statsRows = masterSheet
    ? readQuestionBankSheetRows(workbook.Sheets[masterSheet])
    : [];

  const targetSheets = resolveQuestionBankSheetNames(workbook.SheetNames);
  if (targetSheets.length === 0) {
    const emptyValidation = validateQuestionBankRows([]);
    return {
      payload: null,
      sheetName: "",
      totalRows: 0,
      bankStats: deriveWorkbookBankStats([]),
      validation: emptyValidation,
    };
  }

  const allRows: Record<string, unknown>[] = [];
  for (const sheetName of targetSheets) {
    allRows.push(...readQuestionBankSheetRows(workbook.Sheets[sheetName]));
  }

  const validation = validateQuestionBankRows(allRows);
  const bankStatsBase = deriveWorkbookBankStats(statsRows.length > 0 ? statsRows : allRows);
  const readingConfig = parseStage2ReadingFromWorkbook(workbook);
  const bankStats: WorkbookBankStats = {
    ...bankStatsBase,
    stage2ReadingReference: readingConfig.reference || bankStatsBase.stage2ReadingReference,
    stage2ReadingPassage: readingConfig.passagePreview,
  };

  const payload = validation.valid
    ? { ...parseWorkbookRowsToBank(allRows), meta: bankStats }
    : null;

  return {
    payload,
    sheetName: targetSheets.join(" + "),
    totalRows: allRows.length,
    bankStats,
    validation,
  };
}

/** @deprecated Use parseQuestionBankWorkbookFile */
export async function parseStage1WorkbookFile(file: ArrayBuffer) {
  const result = await parseQuestionBankWorkbookFile(file);
  return {
    questions: result.payload?.stage1 ?? [],
    sheetName: result.sheetName,
    totalRows: result.totalRows,
    bankStats: result.bankStats,
    validation: result.validation,
  };
}
