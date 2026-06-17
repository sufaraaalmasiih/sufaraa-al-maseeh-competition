import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const TEMPLATE = path.join(process.cwd(), "public", "templates", "sufaraa-questions-template.xlsx");

const BANK_CONFIG_ROWS: (string | number)[][] = [
  ["إعدادات بنك الأسئلة — سفراء المسيح"],
  [""],
  ["stage", "stageName", "bankSizeHint", "displayCountDefault", "notes"],
  ["Stage1", "اجمعوا الكنوز", 50, 40, "كل الأسئلة في ورقة Stage1 أو All_Questions بـ stage=Stage1"],
  ["Stage2", "فتشوا الكتب", 20, 20, "أسئلة المرحلة الثانية فقط — لا تخلط مع Stage1"],
  ["Stage3", "على المحك", 30, 30, "لوحة 5×6 — كل سؤال في stage=Stage3"],
  ["Stage4", "اثبتوا بالحق", 15, 15, "أسئلة المرحلة الرابعة فقط"],
  [""],
  ["ملاحظات للمشرف"],
  ["1", "عدد الأسئلة الظاهرة في المسابقة يُحدد من تبويب إعدادات الميسر (ليس من هذا الملف)."],
  ["2", "هذا الملف يحدد البنك الكامل — مثلاً 200 سؤال في Stage1 والميسر يختار 40."],
  ["3", "المرحلة الثانية — المرجع للقراءة: ضع المرجع المختصر في عمود notes (مثل: يوحنا 15: 1-17)."],
  ["4", "المرحلة الثانية — نص المقطع الكامل لأسئلة matching في عمود data."],
  ["5", "أسئلة matching المتتالية بنفس قيمة data تنتمي لنفس جولة القراءة."],
  ["6", "لا تظهر أسئلة Stage1 في Stage2 — كل مرحلة لها عمود stage منفصل."],
];

const README_APPEND: string[][] = [
  [""],
  ["═══ إعدادات العرض (للميسر) ═══"],
  ["الميسر يحدد من تبويب الإعدادات: عدد الأسئلة الظاهرة + ترتيب الميسر أو عشوائي."],
  ["مثال: Stage1 فيه 200 سؤال → الإعدادات: 40 سؤال → يظهر 40 فقط."],
  [""],
  ["═══ المرحلة الثانية — تحديد المرجع ═══"],
  ["notes = المرجع المختصر على شاشة القراءة (يوحنا 15: 1-17)"],
  ["data = النص الكامل للمقطع (لأسئلة matching و complete)"],
  ["targetPart = اسم المجال (اختياري)"],
  ["category = تصنيف السؤال (اختياري)"],
];

function enhanceWorkbook(filePath: string): void {
  const workbook = XLSX.read(fs.readFileSync(filePath));

  const configSheet = XLSX.utils.aoa_to_sheet(BANK_CONFIG_ROWS);
  configSheet["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, configSheet, "Bank_Config");

  const readmeName = workbook.SheetNames.find((name) => name.toLowerCase() === "readme");
  if (readmeName) {
    const existing = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[readmeName], {
      header: 1,
      defval: "",
    }) as string[][];
    const merged = [...existing, ...README_APPEND];
    workbook.Sheets[readmeName] = XLSX.utils.aoa_to_sheet(merged);
  }

  XLSX.writeFile(workbook, filePath);
  console.log(`Enhanced template: ${filePath}`);
}

if (!fs.existsSync(TEMPLATE)) {
  const fallback = path.join(
    process.env.USERPROFILE ?? "",
    "Downloads",
    "sufaraa_christ_question_bank_current (1).xlsx",
  );
  if (fs.existsSync(fallback)) {
    fs.mkdirSync(path.dirname(TEMPLATE), { recursive: true });
    fs.copyFileSync(fallback, TEMPLATE);
  } else {
    console.error("Template not found:", TEMPLATE);
    process.exit(1);
  }
}

enhanceWorkbook(TEMPLATE);
