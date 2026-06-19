import * as XLSX from "xlsx";
import type { FullQuestionBankPayload } from "@/features/facilitator/question-bank-types";

/**
 * تصدير بنك الأسئلة الحالي إلى ملف Excel قابل لإعادة الاستيراد (رحلة ذهاب-إياب).
 * الأعمدة بنفس مفاتيح المُستورِد، مع صف عناوين عربية فوقها للقراءة البشرية.
 */

interface ExportColumn {
  key: string;
  arabic: string;
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "id", arabic: "رقم السؤال" },
  { key: "stage", arabic: "المرحلة" },
  { key: "type", arabic: "نوع السؤال" },
  { key: "category", arabic: "المجال (م3)" },
  { key: "level", arabic: "المستوى (م3)" },
  { key: "question", arabic: "السؤال" },
  { key: "data", arabic: "المعطيات" },
  { key: "option1", arabic: "خيار 1" },
  { key: "option2", arabic: "خيار 2" },
  { key: "option3", arabic: "خيار 3" },
  { key: "option4", arabic: "خيار 4" },
  { key: "correct", arabic: "الإجابة الصحيحة" },
  { key: "acceptedanswers", arabic: "الإجابات المقبولة" },
  { key: "points", arabic: "النقاط" },
  { key: "targetpart", arabic: "الجزء الخطأ (صح/خطأ)" },
  { key: "imageurl", arabic: "رابط الصورة" },
  { key: "reference", arabic: "المرجع" },
  { key: "notes", arabic: "ملاحظات" },
];

type ExportRow = Record<string, string>;

function joinPipe(values: unknown): string {
  return Array.isArray(values)
    ? values.map((value) => String(value ?? "").trim()).filter(Boolean).join(" | ")
    : "";
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function applyOptions(row: ExportRow, options: unknown): void {
  if (!Array.isArray(options)) {
    return;
  }
  options.slice(0, 4).forEach((option, index) => {
    row[`option${index + 1}`] = str(option);
  });
}

function buildStage1Rows(payload: FullQuestionBankPayload): ExportRow[] {
  return payload.stage1.map((question) => {
    const q = question as unknown as Record<string, unknown>;
    const row: ExportRow = {
      id: str(q.id),
      stage: "stage1",
      type: str(q.type),
      question: str(q.prompt),
      correct: str(q.correctAnswer),
      data: joinPipe(q.parts),
      points: str(q.points),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    };
    applyOptions(row, q.options);
    return row;
  });
}

function buildStage2Rows(payload: FullQuestionBankPayload): ExportRow[] {
  const rows: ExportRow[] = [];

  payload.stage2.matching.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const pairs = Array.isArray(q.pairs) ? (q.pairs as Record<string, unknown>[]) : [];
    pairs.forEach((pair, index) => {
      rows.push({
        id: `${str(q.id)}-${index + 1}`,
        stage: "stage2",
        type: "matching",
        question: str(pair.left),
        correct: str(pair.correctRight),
        points: str(q.points),
        reference: str(q.reference),
        imageurl: str(q.imageUrl),
      });
    });
  });

  payload.stage2.arrangeVerse.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    rows.push({
      id: str(q.id),
      stage: "stage2",
      type: "arrangeVerse",
      question: str(q.prompt),
      data: joinPipe(q.fragments),
      correct: joinPipe(q.correctOrder),
      points: str(q.points),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    });
  });

  payload.stage2.completeVerse.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    rows.push({
      id: str(q.id),
      stage: "stage2",
      type: "completeVerse",
      question: str(q.prompt),
      data: str(q.verseWithBlank),
      correct: str(q.correctAnswer),
      points: str(q.points),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    });
  });

  payload.stage2.trueFalseCorrect.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    rows.push({
      id: str(q.id),
      stage: "stage2",
      type: "trueFalseCorrect",
      question: str(q.statement),
      correct: q.correctIsTrue === true ? "صح" : "خطأ",
      data: str(q.expectedCorrection),
      targetpart: str(q.expectedWrongPart),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    });
  });

  return rows;
}

function buildStage3Rows(payload: FullQuestionBankPayload): ExportRow[] {
  return Object.values(payload.stage3).map((question) => {
    const q = question as unknown as Record<string, unknown>;
    const row: ExportRow = {
      id: str(q.id),
      stage: "stage3",
      type: str(q.type),
      category: str(q.fieldLabel) || str(q.fieldId),
      level: str(q.difficulty),
      question: str(q.prompt),
      correct: str(q.correctAnswer),
      data: joinPipe(q.parts),
      points: str(q.points),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    };
    applyOptions(row, q.options);
    return row;
  });
}

function buildStage4Rows(payload: FullQuestionBankPayload): ExportRow[] {
  return payload.stage4.map((question) => {
    const q = question as unknown as Record<string, unknown>;
    const type = str(q.type);
    const dataValue =
      type === "link"
        ? str(q.linkText)
        : type === "who_am_i"
          ? str(q.clue)
          : joinPipe(q.parts);
    const row: ExportRow = {
      id: str(q.id),
      stage: "stage4",
      type,
      question: str(q.prompt),
      correct: str(q.correctAnswer),
      data: dataValue,
      acceptedanswers: joinPipe(q.acceptedAnswers),
      points: str(q.points),
      reference: str(q.reference),
      imageurl: str(q.imageUrl),
    };
    applyOptions(row, q.options);
    return row;
  });
}

/** يبني صفوف التصدير (كل المراحل) من حمولة البنك. */
export function buildBankExportRows(payload: FullQuestionBankPayload): ExportRow[] {
  return [
    ...buildStage1Rows(payload),
    ...buildStage2Rows(payload),
    ...buildStage3Rows(payload),
    ...buildStage4Rows(payload),
  ];
}

/** يبني مصفوفة الخلايا (عناوين عربية + مفاتيح + بيانات) لورقة All_Questions. */
function buildSheetMatrix(payload: FullQuestionBankPayload): string[][] {
  const rows = buildBankExportRows(payload);
  const arabicHeader = EXPORT_COLUMNS.map((column) => column.arabic);
  const keyHeader = EXPORT_COLUMNS.map((column) => column.key);
  const dataRows = rows.map((row) =>
    EXPORT_COLUMNS.map((column) => row[column.key] ?? ""),
  );
  return [arabicHeader, keyHeader, ...dataRows];
}

/** يبني مصنّف Excel ويبدأ تنزيله في المتصفّح. */
export function exportQuestionBankToExcel(
  payload: FullQuestionBankPayload,
  fileName = "sufaraa-current-question-bank.xlsx",
): number {
  const matrix = buildSheetMatrix(payload);
  const worksheet = XLSX.utils.aoa_to_sheet(matrix);
  worksheet["!cols"] = EXPORT_COLUMNS.map((column) => ({
    wch: column.key === "question" || column.key === "data" ? 40 : 16,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All_Questions");

  // ورقة معلومات القراءة للمرحلة الثانية (مرجعية فقط).
  const readingSheet = XLSX.utils.aoa_to_sheet([
    ["field", "value"],
    ["reference", payload.meta.stage2ReadingReference],
    ["passagePreview", payload.meta.stage2ReadingPassage],
  ]);
  XLSX.utils.book_append_sheet(workbook, readingSheet, "قراءة_م2");

  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return matrix.length - 2;
}
