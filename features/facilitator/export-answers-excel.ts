"use client";

import type { WorkSheet } from "xlsx";

export interface ExportAnswersRow {
  time: string;
  stage: string;
  question: string;
  answer: string;
  correctAnswer?: string;
  result: string;
  pointsDelta?: number | null;
}

interface ExportAnswersExcelOptions {
  teamName: string;
  rows: ExportAnswersRow[];
  filePrefix?: string;
}

type Cell = string | number;

/** يبني ورقة منسّقة: صف عنوان مدموج + رأس + بيانات، مع عرض أعمدة وتجميد الرأس واتجاه RTL. */
function buildStyledSheet(
  XLSX: typeof import("xlsx"),
  title: string,
  headers: string[],
  dataRows: Cell[][],
  widths: number[],
): WorkSheet {
  const aoa: Cell[][] = [[title], headers, ...dataRows];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  // تجميد الصفّين العلويين (العنوان + الرأس).
  (sheet as WorkSheet & { "!freeze"?: unknown })["!freeze"] = { xSplit: 0, ySplit: 2 };
  return sheet;
}

function rtlWorkbook(XLSX: typeof import("xlsx")) {
  const workbook = XLSX.utils.book_new();
  (workbook as { Workbook?: { Views?: { RTL?: boolean }[] } }).Workbook = {
    Views: [{ RTL: true }],
  };
  return workbook;
}

export async function exportAnswersExcel({
  teamName,
  rows,
  filePrefix = "team-answers",
}: ExportAnswersExcelOptions): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = ["الوقت", "المرحلة", "السؤال", "الإجابة", "الإجابة الصحيحة", "النتيجة", "النقاط"];
  const dataRows: Cell[][] = rows.map((row) => [
    row.time,
    row.stage,
    row.question,
    row.answer,
    row.correctAnswer ?? "",
    row.result,
    typeof row.pointsDelta === "number" ? row.pointsDelta : "",
  ]);
  const sheet = buildStyledSheet(
    XLSX,
    `إجابات الفريق: ${teamName}`,
    headers,
    dataRows,
    [18, 14, 46, 30, 30, 12, 8],
  );
  const workbook = rtlWorkbook(XLSX);
  XLSX.utils.book_append_sheet(workbook, sheet, "إجابات");

  const safeTeamName = teamName.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");
  XLSX.writeFile(workbook, `${filePrefix}-${safeTeamName || "team"}.xlsx`);
}

export interface ExportFinalResultRow {
  rank: number;
  teamName: string;
  governorate: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  total: number;
}

/** تصدير الترتيب النهائي التفصيلي إلى ملف Excel. */
export async function exportFinalResultsExcel(
  rows: ExportFinalResultRow[],
  filePrefix = "نتائج-سفراء-المسيح",
): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = ["المركز", "الفريق", "المحافظة", "المرحلة 1", "المرحلة 2", "المرحلة 3", "المرحلة 4", "المجموع"];
  const dataRows: Cell[][] = rows.map((row) => [
    row.rank,
    row.teamName,
    row.governorate,
    row.stage1,
    row.stage2,
    row.stage3,
    row.stage4,
    row.total,
  ]);
  const sheet = buildStyledSheet(
    XLSX,
    "الترتيب النهائي — سفراء المسيح",
    headers,
    dataRows,
    [8, 26, 18, 12, 12, 12, 12, 12],
  );
  const workbook = rtlWorkbook(XLSX);
  XLSX.utils.book_append_sheet(workbook, sheet, "الترتيب النهائي");
  XLSX.writeFile(workbook, `${filePrefix}.xlsx`);
}
