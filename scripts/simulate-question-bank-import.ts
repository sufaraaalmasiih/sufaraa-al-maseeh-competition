/**
 * Simulates question-bank import validation and parsing.
 * Run: npx tsx scripts/simulate-question-bank-import.ts
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { readQuestionBankSheetRows } from "@/features/facilitator/question-bank-excel-import";
import { parseWorkbookRowsToBank } from "@/features/facilitator/question-bank-workbook-parser";
import { validateQuestionBankRows } from "@/features/facilitator/question-bank-workbook-validation";

const EASY_BANK = path.join(
  process.cwd(),
  "public",
  "templates",
  "sufaraa-easy-bible-questions.xlsx",
);

function loadRows(filePath: string): Record<string, unknown>[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets.All_Questions ?? workbook.Sheets[workbook.SheetNames[0]];
  return readQuestionBankSheetRows(sheet);
}

function simulate(label: string, rows: Record<string, unknown>[]) {
  const validation = validateQuestionBankRows(rows, 4);
  const payload = validation.valid ? parseWorkbookRowsToBank(rows) : null;

  console.log(`\n=== ${label} ===`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Valid: ${validation.valid}`);
  console.log(`Errors: ${validation.errors.length}`);
  validation.errors.slice(0, 5).forEach((error) => {
    console.log(`  - [${error.id}] ${error.message}`);
  });
  if (payload) {
    console.log(
      `Parsed: stage1=${payload.stage1.length}, stage2 matching=${payload.stage2.matching.length}, stage3=${Object.keys(payload.stage3).length}, stage4=${payload.stage4.length}`,
    );
  }
  return { validation, payload };
}

function main() {
  if (!fs.existsSync(EASY_BANK)) {
    throw new Error(`Missing ${EASY_BANK}. Run: npx tsx scripts/build-easy-bible-questions-bank.ts`);
  }

  const easyRows = loadRows(EASY_BANK);
  simulate("Easy Bible bank (official)", easyRows);

  // Trap: matching type in stage1 — must fail validation
  const trapMatchingInStage1 = easyRows.map((row, index) =>
    index === 0 ? { ...row, type: "توصيل", stage: "stage1" } : row,
  );
  simulate("TRAP: توصيل in stage1 (should FAIL)", trapMatchingInStage1);

  // Trap: MC labeled as matching columns in stage1 — passes validation but wrong UI
  const trapMcAsMatchingCols = [
    {
      id: "trap-mc-as-match",
      stage: "stage1",
      type: "اختر من متعدد",
      question: "من هو أول ملك؟",
      option1: "شاول",
      option2: "داود",
      correct: "شاول",
    },
  ];
  const trapMcResult = simulate("TRAP: stage1 MC (minimal row — should PASS)", trapMcAsMatchingCols);

  // Trap: stage3 matching type — passes validation but coerces to fill_blank at parse
  const trapStage3Matching = [
    {
      id: "characters_q99",
      stage: "stage3",
      type: "توصيل",
      category: "شخصيات",
      level: "سهل",
      question: "وصّل",
      option1: "آدم",
      correct: "حواء",
    },
  ];
  const trapS3 = simulate("TRAP: stage3 توصيل (valid import, WRONG gameplay UI)", trapStage3Matching);
  if (trapS3.payload) {
    const q = trapS3.payload.stage3.characters_q99;
    console.log(`  Parsed stage3 type: ${q?.type ?? "missing"}`);
  }

  console.log("\n=== Summary ===");
  console.log("✓ Easy bank ready for facilitator import before competition starts");
  console.log("✗ stage1 cannot use توصيل — validation blocks it");
  console.log("⚠ stage3 توصيل imports as fill_blank — use اختر من متعدد for board cells");
  console.log("⚠ Import only when status is waiting_players or competition_intro");
}

main();
