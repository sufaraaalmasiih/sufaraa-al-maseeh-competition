import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { BIBLE_BANK_ALL_ROWS } from "../data/bible-questions-bank";

const OUTPUT = path.join(process.cwd(), "public", "templates", "sufaraa-bible-bank.xlsx");

const ARABIC_HEADERS = [
  "رقم السؤال", "المرحلة", "اسم المرحلة", "نوع السؤال", "اسم النوع", "المجال", "المستوى",
  "السؤال", "المعطيات", "خيار 1", "خيار 2", "خيار 3", "خيار 4", "الإجابة الصحيحة",
  "الإجابات المقبولة", "النقاط", "رابط الصورة", "رابط الفيديو", "الجزء المطلوب", "ملاحظات",
];
const ENGLISH_KEYS = [
  "id", "stage", "stageName", "type", "typeName", "category", "level", "question", "data",
  "option1", "option2", "option3", "option4", "correct", "acceptedAnswers", "points",
  "imageUrl", "videoUrl", "targetPart", "notes",
];
const WIDTHS = [14, 10, 22, 14, 16, 14, 8, 44, 36, 16, 16, 16, 16, 22, 22, 8, 18, 16, 18, 22];

const COLORS = {
  navy: "FF143A5A",
  accent: "FF2388C4",
  sky: "FFE8F4FC",
  slate: "FFF1F5F9",
  white: "FFFFFFFF",
  alt: "FFF8FAFC",
  border: "FFCBD5E1",
  muted: "FF64748B",
  required: "FFFFF7E6",
};
const REQUIRED = new Set([1, 2, 4, 8, 14]); // id, stage, type, question, correct

function border(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: COLORS.border } };
  return { top: side, left: side, bottom: side, right: side };
}

function fill(
  cell: ExcelJS.Cell,
  value: ExcelJS.CellValue,
  o: { bold?: boolean; size?: number; color?: string; bg?: string; center?: boolean; wrap?: boolean } = {},
) {
  cell.value = value;
  cell.font = { name: "Calibri", bold: o.bold ?? false, size: o.size ?? 11, color: { argb: o.color ?? COLORS.navy } };
  if (o.bg) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: o.bg } };
  cell.alignment = { vertical: "middle", horizontal: o.center ? "center" : "right", wrapText: o.wrap ?? false, readingOrder: "rtl" };
  cell.border = border();
}

function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("All_Questions", { views: [{ rightToLeft: true, state: "frozen", ySplit: 3 }] });
  sheet.columns = WIDTHS.map((width) => ({ width }));

  // صف العنوان
  sheet.mergeCells(1, 1, 1, ENGLISH_KEYS.length);
  fill(sheet.getCell(1, 1), "بنك أسئلة سفراء المسيح — من الكتاب المقدس (150 سؤالاً)", {
    bold: true, size: 18, color: COLORS.white, bg: COLORS.accent, center: true,
  });
  sheet.getRow(1).height = 42;

  // صفّا العناوين (عربي ثم مفاتيح إنجليزية)
  ENGLISH_KEYS.forEach((_, index) => {
    const col = index + 1;
    fill(sheet.getCell(2, col), ARABIC_HEADERS[index], {
      bold: true, color: COLORS.navy, bg: REQUIRED.has(col) ? COLORS.required : COLORS.sky, center: true, wrap: true,
    });
    fill(sheet.getCell(3, col), ENGLISH_KEYS[index], { bold: true, size: 10, color: COLORS.muted, bg: COLORS.slate, center: true });
  });
  sheet.getRow(2).height = 30;
  sheet.getRow(3).height = 20;

  // صفوف البيانات (تظليل متناوب)
  BIBLE_BANK_ALL_ROWS.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 4);
    const bg = rowIndex % 2 === 0 ? COLORS.white : COLORS.alt;
    ENGLISH_KEYS.forEach((_, colIndex) => {
      fill(excelRow.getCell(colIndex + 1), row[colIndex] ?? "", {
        bg, center: colIndex <= 6 || colIndex === 15, wrap: colIndex === 7 || colIndex === 8,
      });
    });
    excelRow.height = (row[7]?.length ?? 0) > 60 ? 34 : 22;
  });

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  void workbook.xlsx.writeFile(OUTPUT).then(() => {
    const counts = { stage1: 0, stage2: 0, stage3: 0, stage4: 0 };
    for (const row of BIBLE_BANK_ALL_ROWS) {
      const stage = row[1] as keyof typeof counts;
      if (stage in counts) counts[stage] += 1;
    }
    console.log(`Wrote ${OUTPUT}`);
    console.log(`Total ${BIBLE_BANK_ALL_ROWS.length} —`, counts);
  });
}

main();
