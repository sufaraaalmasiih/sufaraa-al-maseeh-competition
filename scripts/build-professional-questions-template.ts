import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  buildStage1CanonicalRows,
  buildStage2CanonicalRows,
  buildStage3CanonicalRows,
  buildStage4CanonicalRows,
} from "@/features/facilitator/question-bank-canonical-samples";
import {
  buildOfficialTypeListRows,
  getAllArabicTypeOptions,
  getStage1ArabicTypeOptions,
  getStage2ArabicTypeOptions,
  getStage3ArabicFieldOptions,
  getStage3ArabicLevelOptions,
  getStage3ArabicTypeOptions,
  getStage4ArabicTypeOptions,
} from "@/features/facilitator/question-type-registry";

const OUTPUT = path.join(process.cwd(), "public", "templates", "sufaraa-questions-template.xlsx");

const COLORS = {
  navy: "FF143A5A",
  blue: "FF2388C4",
  sky: "FFE8F4FC",
  slate: "FFF1F5F9",
  white: "FFFFFFFF",
  alt: "FFF8FAFC",
  border: "FFCBD5E1",
  muted: "FF64748B",
  gold: "FFD4A853",
  required: "FFFFF7E6",
  stage1: "FF1B6B4A",
  stage2: "FF2388C4",
  stage3: "FF6B4FA8",
  stage4: "FF8B3A3A",
};

const QUESTION_COL_WIDTHS = [
  14, 10, 22, 14, 16, 14, 8, 42, 36, 18, 18, 18, 18, 22, 22, 8, 18, 18, 18, 24,
];

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

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: COLORS.border } };
  return { top: side, left: side, bottom: side, right: side };
}

function fillCell(
  cell: ExcelJS.Cell,
  value: ExcelJS.CellValue,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    bg?: string;
    align?: Partial<ExcelJS.Alignment>;
    wrap?: boolean;
  } = {},
) {
  cell.value = value;
  cell.font = {
    name: "Calibri",
    bold: options.bold ?? false,
    size: options.size ?? 11,
    color: { argb: options.color ?? "FF1E293B" },
  };
  if (options.bg) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.bg } };
  }
  cell.alignment = {
    vertical: "middle",
    horizontal: options.align?.horizontal ?? "right",
    wrapText: options.wrap ?? false,
    readingOrder: "rtl",
    ...options.align,
  };
  cell.border = thinBorder();
}

function setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.columns = widths.map((width) => ({ width }));
}

const TYPE_COLUMN = 4;
const REQUIRED_HEADER_COLUMNS = new Set([1, 2, 4, 8]);
const CATEGORY_COLUMN = 6;
const LEVEL_COLUMN = 7;
const DATA_ROW_START = 4;
const DATA_ROW_END = 500;

interface DropdownRanges {
  stage1: string;
  stage2: string;
  stage3: string;
  stage4: string;
  all: string;
  stage3Fields: string;
  stage3Levels: string;
}

function columnLetter(col: number): string {
  let letter = "";
  let index = col;
  while (index > 0) {
    const remainder = (index - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

function applyListDropdown(
  sheet: ExcelJS.Worksheet,
  column: number,
  rangeRef: string,
  prompt: string,
) {
  const letter = columnLetter(column);
  // ExcelJS typings omit dataValidations on Worksheet in some versions.
  (sheet as ExcelJS.Worksheet & { dataValidations: { add: (range: string, rule: object) => void } })
    .dataValidations.add(
    `${letter}${DATA_ROW_START}:${letter}${DATA_ROW_END}`,
    {
    type: "list",
    allowBlank: false,
    formulae: [rangeRef],
    showInputMessage: true,
    promptTitle: "اختر من القائمة",
    prompt,
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "قيمة غير مسموحة",
    error: "يجب الاختيار من القائمة المنسدلة فقط — لا تكتب يدوياً.",
    },
  );
}

function styleQuestionSheet(
  sheet: ExcelJS.Worksheet,
  title: string,
  accent: string,
  dataRows: string[][],
  dropdowns?: {
    typeRange: string;
    typePrompt: string;
    categoryRange?: string;
    categoryPrompt?: string;
    levelRange?: string;
    levelPrompt?: string;
  },
) {
  const colCount = ENGLISH_KEYS.length;
  sheet.views = [{ state: "frozen", ySplit: 3, rightToLeft: true }];

  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  fillCell(titleCell, title, {
    bold: true,
    size: 18,
    color: COLORS.white,
    bg: accent,
    align: { horizontal: "center" },
  });
  sheet.getRow(1).height = 42;

  ENGLISH_KEYS.forEach((_, index) => {
    const col = index + 1;
    const isRequired = REQUIRED_HEADER_COLUMNS.has(col);
    fillCell(sheet.getCell(2, col), ARABIC_HEADERS[index], {
      bold: true,
      size: 11,
      color: COLORS.navy,
      bg: isRequired ? COLORS.required : COLORS.sky,
      wrap: true,
    });
    fillCell(sheet.getCell(3, col), ENGLISH_KEYS[index], {
      bold: true,
      size: 10,
      color: COLORS.muted,
      bg: COLORS.slate,
      align: { horizontal: "center" },
    });
  });
  sheet.getRow(2).height = 30;
  sheet.getRow(3).height = 22;

  dataRows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 4);
    const bg = rowIndex % 2 === 0 ? COLORS.white : COLORS.alt;
    ENGLISH_KEYS.forEach((_, colIndex) => {
      const value = row[colIndex] ?? "";
      fillCell(excelRow.getCell(colIndex + 1), value, {
        bg,
        wrap: colIndex === 7 || colIndex === 8 || colIndex === 19,
        align: { horizontal: colIndex <= 6 ? "center" : "right" },
      });
    });
    excelRow.height = row.some((cell, idx) => [7, 8, 19].includes(idx) && cell.length > 60)
      ? 48
      : 24;
  });

  setColumnWidths(sheet, QUESTION_COL_WIDTHS);

  if (dropdowns) {
    applyListDropdown(sheet, TYPE_COLUMN, dropdowns.typeRange, dropdowns.typePrompt);
    if (dropdowns.categoryRange && dropdowns.categoryPrompt) {
      applyListDropdown(sheet, CATEGORY_COLUMN, dropdowns.categoryRange, dropdowns.categoryPrompt);
    }
    if (dropdowns.levelRange && dropdowns.levelPrompt) {
      applyListDropdown(sheet, LEVEL_COLUMN, dropdowns.levelRange, dropdowns.levelPrompt);
    }
  }
}

function buildReadmeSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ rightToLeft: true }];
  setColumnWidths(sheet, [6, 28, 70]);

  const sections: { kind: "title" | "section" | "bullet" | "spacer"; text: string; sub?: string }[] =
    [
      { kind: "title", text: "سفراء المسيح — دليل بنك الأسئلة" },
      { kind: "spacer", text: "" },
      { kind: "section", text: "كيف تستخدم هذا الملف؟" },
      {
        kind: "bullet",
        text: "1",
        sub: "عدّل الأسئلة في أوراق Stage1–Stage4 أو في All_Questions (الورقة الرئيسية).",
      },
      {
        kind: "bullet",
        text: "2",
        sub: "لتغيير نص قراءة المرحلة الثانية: افتح ورقة «قراءة_م2» وعدّل المرجع ونص المقطع.",
      },
      {
        kind: "bullet",
        text: "3",
        sub: "من لوحة الميسر → الإعدادات: حدد كم سؤالاً يظهر في كل مرحلة (ترتيب أو عشوائي).",
      },
      {
        kind: "bullet",
        text: "4",
        sub: "عمود «نوع السؤال»: قائمة منسدلة عربية — اختر فقط، لا تكتب يدوياً.",
      },
      {
        kind: "bullet",
        text: "5",
        sub: "استورد الملف من تبويب بنك الأسئلة. أسئلة كل مرحلة منفصلة — لا تختلط.",
      },
      { kind: "spacer", text: "" },
      { kind: "section", text: "المرحلة الثانية — قراءة المرجع" },
      {
        kind: "bullet",
        text: "•",
        sub: "ورقة قراءة_م2: المرجع المختصر (مثل يوحنا 15: 1-17) يظهر على شاشة القراءة.",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "نص المقطع (اختياري): معاينة تظهر تحت المرجع — أو يترك الفرق يفتحون الإنجيل.",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "عمود data في أسئلة matching: النص الكامل المستخدم أثناء الإجابة (ليس شاشة القراءة).",
      },
      { kind: "section", text: "أنواع الأسئلة — يجب أن تطابق المشروع" },
      {
        kind: "bullet",
        text: "•",
        sub: "Stage1: missing | multiple_choice | arrange | fill_blank",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "Stage2: matching | arrangeVerse | completeVerse | trueFalseCorrect",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "Stage3: كل أنواع الأسئلة + category (شخصيات…) + level (سهل|متوسط|صعب)",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "Stage4: كل أنواع الأسئلة — راجع ورقة Lists.",
      },
      {
        kind: "bullet",
        text: "•",
        sub: "رتّب / رتّب الآية: عمود «المعطيات» إلزامي (جزء1 | جزء2 | جزء3) — بدون معطيات يُرفض الملف.",
      },
      { kind: "spacer", text: "" },
      { kind: "section", text: "ملاحظة مهمة" },
      {
        kind: "bullet",
        text: "!",
        sub: "لا تحذف الصف الثالث (المفاتيح الإنجليزية id, stage, type...) — الاستيراد يعتمد عليه.",
      },
    ];

  let rowIndex = 1;
  for (const block of sections) {
    const row = sheet.getRow(rowIndex);
    if (block.kind === "title") {
      sheet.mergeCells(rowIndex, 1, rowIndex, 3);
      fillCell(row.getCell(1), block.text, {
        bold: true,
        size: 20,
        color: COLORS.white,
        bg: COLORS.navy,
        align: { horizontal: "center" },
      });
      row.height = 44;
    } else if (block.kind === "section") {
      sheet.mergeCells(rowIndex, 1, rowIndex, 3);
      fillCell(row.getCell(1), block.text, {
        bold: true,
        size: 13,
        color: COLORS.white,
        bg: COLORS.blue,
        align: { horizontal: "right" },
      });
      row.height = 28;
    } else if (block.kind === "bullet") {
      fillCell(row.getCell(1), block.text, {
        bold: true,
        color: COLORS.blue,
        bg: COLORS.alt,
        align: { horizontal: "center" },
      });
      sheet.mergeCells(rowIndex, 2, rowIndex, 3);
      fillCell(row.getCell(2), block.sub ?? "", {
        bg: COLORS.alt,
        wrap: true,
        align: { horizontal: "right" },
      });
      row.height = 26;
    } else {
      row.height = 10;
    }
    rowIndex += 1;
  }
}

function buildStage2ReadingSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ rightToLeft: true }];
  setColumnWidths(sheet, [22, 16, 52, 36]);

  sheet.mergeCells(1, 1, 1, 4);
  fillCell(sheet.getCell(1, 1), "قراءة المرحلة الثانية — فتشوا الكتب", {
    bold: true,
    size: 16,
    color: COLORS.white,
    bg: COLORS.stage2,
    align: { horizontal: "center" },
  });
  sheet.getRow(1).height = 40;

  ["الحقل (عربي)", "field", "القيمة", "شرح للمشرف"].forEach((header, index) => {
    fillCell(sheet.getCell(2, index + 1), header, {
      bold: true,
      color: COLORS.navy,
      bg: COLORS.sky,
      align: { horizontal: "center" },
    });
  });
  sheet.getRow(2).height = 28;

  const rows: [string, string, string, string][] = [
    [
      "المرجع على الشاشة",
      "reference",
      "يوحنا 15: 1-17",
      "يظهر بخط كبير على شاشة القراءة للمتسابقين والجمهور",
    ],
    [
      "نص المقطع (اختياري)",
      "passagePreview",
      "",
      "معاينة قصيرة تحت المرجع. اتركه فارغاً إذا تريد أن يفتحوا الإنجيل فقط",
    ],
    [
      "مجموعة القراءة",
      "readingGroup",
      "default",
      "لربط عدة جولات قراءة لاحقاً (اترك default للجولة الحالية)",
    ],
    [
      "نشط في المسابقة",
      "active",
      "yes",
      "yes = تُستخدم هذه الجولة عند بدء المرحلة الثانية",
    ],
  ];

  rows.forEach((rowData, rowIndex) => {
    const row = sheet.getRow(rowIndex + 3);
    const bg = rowIndex % 2 === 0 ? COLORS.white : COLORS.alt;
    rowData.forEach((value, colIndex) => {
      fillCell(row.getCell(colIndex + 1), value, {
        bg,
        wrap: colIndex >= 2,
        bold: colIndex === 2 && rowIndex === 0,
        align: { horizontal: colIndex === 1 ? "center" : "right" },
      });
    });
    row.height = rowIndex === 1 ? 36 : 28;
  });

  sheet.mergeCells(8, 1, 8, 4);
  fillCell(sheet.getCell(8, 1), "💡 يمكن أيضاً تعديل النص من لوحة الميسر → الإعدادات → قراءة المرحلة الثانية", {
    color: COLORS.muted,
    bg: COLORS.slate,
    wrap: true,
    align: { horizontal: "center" },
  });
  sheet.getRow(8).height = 32;
}

function writeDropdownList(
  sheet: ExcelJS.Worksheet,
  column: number,
  startRow: number,
  title: string,
  options: string[],
): string {
  const letter = columnLetter(column);
  fillCell(sheet.getCell(startRow, column), title, {
    bold: true,
    color: COLORS.navy,
    bg: COLORS.slate,
    align: { horizontal: "center" },
  });
  options.forEach((option, index) => {
    fillCell(sheet.getCell(startRow + 1 + index, column), option, {
      bg: COLORS.white,
      align: { horizontal: "right" },
    });
  });
  const firstDataRow = startRow + 1;
  const lastDataRow = startRow + options.length;
  return `Lists!$${letter}$${firstDataRow}:$${letter}$${lastDataRow}`;
}

function buildListsSheet(sheet: ExcelJS.Worksheet): DropdownRanges {
  sheet.views = [{ rightToLeft: true }];
  setColumnWidths(sheet, [12, 22, 22, 28, 50, 4, 22, 22, 22, 22, 22]);

  sheet.mergeCells(1, 1, 1, 5);
  fillCell(sheet.getCell(1, 1), "القوائم المرجعية — أنواع الأسئلة الرسمية (متطابقة مع المشروع)", {
    bold: true,
    size: 15,
    color: COLORS.white,
    bg: COLORS.navy,
    align: { horizontal: "center" },
  });
  sheet.getRow(1).height = 36;

  ["stage", "stageName", "type", "typeName", "notes"].forEach((header, index) => {
    fillCell(sheet.getCell(2, index + 1), header, {
      bold: true,
      bg: COLORS.sky,
      align: { horizontal: "center" },
    });
  });

  buildOfficialTypeListRows().forEach((rowData, rowIndex) => {
    const row = sheet.getRow(rowIndex + 3);
    const stageAccent =
      rowData.stage === "stage1"
        ? COLORS.stage1
        : rowData.stage === "stage2"
          ? COLORS.stage2
          : rowData.stage === "stage3"
            ? COLORS.stage3
            : COLORS.stage4;
    const bg = rowIndex % 2 === 0 ? COLORS.white : COLORS.alt;
    [rowData.stage, rowData.stageName, rowData.type, rowData.typeName, rowData.notes].forEach(
      (value, colIndex) => {
        fillCell(row.getCell(colIndex + 1), value, {
          bg: colIndex === 0 ? stageAccent : bg,
          color: colIndex === 0 ? COLORS.white : "FF1E293B",
          bold: colIndex === 0,
          wrap: colIndex === 4,
          align: { horizontal: colIndex <= 2 ? "center" : "right" },
        });
      },
    );
    row.height = rowData.notes.length > 40 ? 32 : 24;
  });

  const dropdownStart = 20;
  fillCell(sheet.getCell(dropdownStart, 6), "قوائم منسدلة — لا تحذف هذه الأعمدة", {
    bold: true,
    color: COLORS.white,
    bg: COLORS.gold,
    align: { horizontal: "center" },
  });
  sheet.mergeCells(dropdownStart, 6, dropdownStart, 11);

  return {
    stage1: writeDropdownList(sheet, 7, dropdownStart + 1, "Stage1 أنواع", getStage1ArabicTypeOptions()),
    stage2: writeDropdownList(sheet, 8, dropdownStart + 1, "Stage2 أنواع", getStage2ArabicTypeOptions()),
    stage3: writeDropdownList(sheet, 9, dropdownStart + 1, "Stage3 أنواع", getStage3ArabicTypeOptions()),
    stage4: writeDropdownList(sheet, 10, dropdownStart + 1, "Stage4 أنواع", getStage4ArabicTypeOptions()),
    all: writeDropdownList(sheet, 11, dropdownStart + 1, "كل الأنواع", getAllArabicTypeOptions()),
    stage3Fields: writeDropdownList(
      sheet,
      7,
      dropdownStart + 8,
      "Stage3 مجالات",
      getStage3ArabicFieldOptions(),
    ),
    stage3Levels: writeDropdownList(
      sheet,
      8,
      dropdownStart + 8,
      "Stage3 مستويات",
      getStage3ArabicLevelOptions(),
    ),
  };
}

function buildBankConfigSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ rightToLeft: true }];
  setColumnWidths(sheet, [12, 20, 14, 16, 50]);

  sheet.mergeCells(1, 1, 1, 5);
  fillCell(sheet.getCell(1, 1), "إعدادات البنوك — مرجع للمشرف", {
    bold: true,
    size: 15,
    color: COLORS.white,
    bg: COLORS.gold,
    align: { horizontal: "center" },
  });

  const headers = ["stage", "stageName", "bankSizeHint", "displayDefault", "notes"];
  headers.forEach((header, index) => {
    fillCell(sheet.getCell(2, index + 1), header, {
      bold: true,
      bg: COLORS.sky,
      align: { horizontal: "center" },
    });
  });

  const rows = [
    ["Stage1", "اجمعوا الكنوز", 50, 40, "البنك الكامل هنا — العدد الظاهر من إعدادات الميسر"],
    ["Stage2", "فتشوا الكتب", 20, 20, "نص القراءة من ورقة قراءة_م2"],
    ["Stage3", "على المحك", 30, 30, "لوحة 5×6"],
    ["Stage4", "اثبتوا بالحق", 15, 15, "بنك مستقل"],
  ];

  rows.forEach((rowData, rowIndex) => {
    const row = sheet.getRow(rowIndex + 3);
    rowData.forEach((value, colIndex) => {
      fillCell(row.getCell(colIndex + 1), value, {
        bg: rowIndex % 2 === 0 ? COLORS.white : COLORS.alt,
        wrap: colIndex === 4,
      });
    });
    row.height = 24;
  });
}

async function buildProfessionalTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "سفراء المسيح";
  workbook.created = new Date();

  // العيّنات تُستخدم في ورقة «أمثلة» فقط — الأوراق الرئيسية تبقى فارغة للكتابة.
  const stage1Sample = buildStage1CanonicalRows();
  const stage2Sample = buildStage2CanonicalRows();
  const stage3Sample = buildStage3CanonicalRows();
  const stage4Sample = buildStage4CanonicalRows();

  // صفوف فارغة جاهزة للكتابة (مع بقاء التنسيق والقوائم المنسدلة).
  const emptyRows = (count: number): string[][] =>
    Array.from({ length: count }, () => new Array(ENGLISH_KEYS.length).fill(""));

  const lists = workbook.addWorksheet("Lists", { views: [{ rightToLeft: true }] });
  const dropdowns = buildListsSheet(lists);

  const all = workbook.addWorksheet("All_Questions", { views: [{ rightToLeft: true }] });
  styleQuestionSheet(all, "كل الأسئلة — All Questions (الورقة الرئيسية — اكتب أسئلتك هنا)", COLORS.navy, emptyRows(40), {
    typeRange: dropdowns.all,
    typePrompt: "اختر نوع السؤال بالعربية من القائمة",
  });

  const s1 = workbook.addWorksheet("Stage1", { views: [{ rightToLeft: true }] });
  styleQuestionSheet(s1, "المرحلة الأولى — اجمعوا الكنوز (فارغة — للكتابة)", COLORS.stage1, emptyRows(25), {
    typeRange: dropdowns.stage1,
    typePrompt: "اختر نوع سؤال المرحلة الأولى",
  });

  const s2 = workbook.addWorksheet("Stage2", { views: [{ rightToLeft: true }] });
  styleQuestionSheet(s2, "المرحلة الثانية — فتشوا الكتب (فارغة — للكتابة)", COLORS.stage2, emptyRows(25), {
    typeRange: dropdowns.stage2,
    typePrompt: "اختر نوع سؤال المرحلة الثانية",
  });

  const s3 = workbook.addWorksheet("Stage3", { views: [{ rightToLeft: true }] });
  styleQuestionSheet(s3, "المرحلة الثالثة — على المحك (فارغة — للكتابة)", COLORS.stage3, emptyRows(25), {
    typeRange: dropdowns.stage3,
    typePrompt: "اختر نوع السؤال — كل الأنواع مسموحة",
    categoryRange: dropdowns.stage3Fields,
    categoryPrompt: "اختر مجالاً جاهزاً أو اكتب اسماً مخصّصاً (حتى 6 مجالات)",
    levelRange: dropdowns.stage3Levels,
    levelPrompt: "اختر المستوى (سهل، متوسط، صعب)",
  });

  const s4 = workbook.addWorksheet("Stage4", { views: [{ rightToLeft: true }] });
  styleQuestionSheet(s4, "المرحلة الرابعة — اثبتوا بالحق (فارغة — للكتابة)", COLORS.stage4, emptyRows(25), {
    typeRange: dropdowns.stage4,
    typePrompt: "اختر نوع السؤال — كل الأنواع مسموحة",
  });

  const readme = workbook.addWorksheet("README", { views: [{ rightToLeft: true }] });
  buildReadmeSheet(readme);

  const reading = workbook.addWorksheet("قراءة_م2", { views: [{ rightToLeft: true }] });
  buildStage2ReadingSheet(reading);

  const config = workbook.addWorksheet("Bank_Config", { views: [{ rightToLeft: true }] });
  buildBankConfigSheet(config);

  const examples = workbook.addWorksheet("أمثلة", { views: [{ rightToLeft: true }] });
  const exampleRows = [
    stage1Sample[0],
    stage1Sample[1],
    stage2Sample[0],
    stage2Sample[1],
    stage3Sample[0],
    stage4Sample[0],
  ].filter(Boolean) as string[][];
  styleQuestionSheet(
    examples,
    "أمثلة مرجعية — لا تُستورد (انسخ منها إلى الأوراق الرئيسية)",
    COLORS.gold,
    exampleRows,
  );

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  await workbook.xlsx.writeFile(OUTPUT);
  console.log(`Professional template written: ${OUTPUT}`);
}

void buildProfessionalTemplate();
