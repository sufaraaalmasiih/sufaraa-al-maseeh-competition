"use client";

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

export async function exportAnswersExcel({
  teamName,
  rows,
  filePrefix = "team-answers",
}: ExportAnswersExcelOptions): Promise<void> {
  const XLSX = await import("xlsx");
  const sheetRows = rows.map((row) => ({
    الوقت: row.time,
    المرحلة: row.stage,
    السؤال: row.question,
    الإجابة: row.answer,
    "الإجابة الصحيحة": row.correctAnswer ?? "",
    النتيجة: row.result,
    النقاط: typeof row.pointsDelta === "number" ? row.pointsDelta : "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "إجابات");

  const safeTeamName = teamName
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");
  const fileName = `${filePrefix}-${safeTeamName || "team"}.xlsx`;
  XLSX.writeFile(workbook, fileName);
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
  const sheetRows = rows.map((row) => ({
    المركز: row.rank,
    الفريق: row.teamName,
    المحافظة: row.governorate,
    "المرحلة 1": row.stage1,
    "المرحلة 2": row.stage2,
    "المرحلة 3": row.stage3,
    "المرحلة 4": row.stage4,
    المجموع: row.total,
  }));
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الترتيب النهائي");
  XLSX.writeFile(workbook, `${filePrefix}.xlsx`);
}
