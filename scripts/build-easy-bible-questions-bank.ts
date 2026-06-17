import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { EASY_BIBLE_ALL_ROWS } from "../data/easy-bible-questions-bank";

const OUTPUT = path.join(
  process.cwd(),
  "public",
  "templates",
  "sufaraa-easy-bible-questions.xlsx",
);

const ARABIC_HEADERS = [
  "رقم السؤال",
  "المرحلة",
  "اسم المرحلة",
  "نوع السؤال",
  "اسم النوع",
  "المجال",
  "المستوى",
  "السؤال",
  "المعطيات",
  "خيار 1",
  "خيار 2",
  "خيار 3",
  "خيار 4",
  "الإجابة الصحيحة",
  "الإجابات المقبولة",
  "النقاط",
  "رابط الصورة",
  "رابط الفيديو",
  "الجزء المطلوب",
  "ملاحظات",
];

const ENGLISH_KEYS = [
  "id",
  "stage",
  "stageName",
  "type",
  "typeName",
  "category",
  "level",
  "question",
  "data",
  "option1",
  "option2",
  "option3",
  "option4",
  "correct",
  "acceptedAnswers",
  "points",
  "imageUrl",
  "videoUrl",
  "targetPart",
  "notes",
];

function buildSheetRows(): string[][] {
  return [
    ["بنك أسئلة سفراء المسيح — مستوى سهل — من الكتاب المقدس"],
    ARABIC_HEADERS,
    ENGLISH_KEYS,
    ...EASY_BIBLE_ALL_ROWS,
  ];
}

function main() {
  const workbook = XLSX.utils.book_new();
  const allQuestions = XLSX.utils.aoa_to_sheet(buildSheetRows());
  XLSX.utils.book_append_sheet(workbook, allQuestions, "All_Questions");

  const stage1Only = XLSX.utils.aoa_to_sheet([
    ["المرحلة الأولى — اختر من متعدد سهل"],
    ARABIC_HEADERS,
    ENGLISH_KEYS,
    ...EASY_BIBLE_ALL_ROWS.filter((row) => row[1] === "stage1"),
  ]);
  XLSX.utils.book_append_sheet(workbook, stage1Only, "Stage1");

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  XLSX.writeFile(workbook, OUTPUT);
  console.log(`Wrote ${OUTPUT} (${EASY_BIBLE_ALL_ROWS.length} questions)`);
}

main();
