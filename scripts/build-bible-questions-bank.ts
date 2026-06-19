import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
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

function main() {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["بنك أسئلة سفراء المسيح — من الكتاب المقدس (150 سؤالاً)"],
    ARABIC_HEADERS,
    ENGLISH_KEYS,
    ...BIBLE_BANK_ALL_ROWS,
  ]);
  sheet["!cols"] = ENGLISH_KEYS.map((key) => ({
    wch: key === "question" || key === "data" ? 44 : 16,
  }));
  XLSX.utils.book_append_sheet(workbook, sheet, "All_Questions");

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  XLSX.writeFile(workbook, OUTPUT);

  const counts = { stage1: 0, stage2: 0, stage3: 0, stage4: 0 };
  for (const row of BIBLE_BANK_ALL_ROWS) {
    const stage = row[1] as keyof typeof counts;
    if (stage in counts) counts[stage] += 1;
  }
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Total ${BIBLE_BANK_ALL_ROWS.length} —`, counts);
}

main();
