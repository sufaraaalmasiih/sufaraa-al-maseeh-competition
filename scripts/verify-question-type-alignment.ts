import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  normalizeStage1ExcelType,
  normalizeStage2ExcelType,
  normalizeStage3ExcelType,
  normalizeStage4ExcelType,
  getStage1ArabicTypeOptions,
  getStage2ArabicTypeOptions,
  getStage3ArabicTypeOptions,
  getStage4ArabicTypeOptions,
} from "../features/facilitator/question-type-registry";

const TEMPLATE = path.join(process.cwd(), "public", "templates", "sufaraa-questions-template.xlsx");

function sheetTypes(sheetName: string): Set<string> {
  const wb = XLSX.read(fs.readFileSync(TEMPLATE));
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  const types = new Set<string>();
  rows.slice(3).forEach((row) => {
    const stage = String(row[1] ?? "").trim().toLowerCase();
    const type = String(row[3] ?? "").trim();
    if (!type) {
      return;
    }
    if (stage === "stage1" && !normalizeStage1ExcelType(type)) {
      types.add(`INVALID:${type}`);
    } else if (stage === "stage2" && !normalizeStage2ExcelType(type)) {
      types.add(`INVALID:${type}`);
    } else if (stage === "stage3" && !normalizeStage3ExcelType(type)) {
      types.add(`INVALID:${type}`);
    } else if (stage === "stage4" && !normalizeStage4ExcelType(type)) {
      types.add(`INVALID:${type}`);
    } else {
      types.add(type);
    }
  });
  return types;
}

function expectedArabicTypes(stage: "stage1" | "stage2" | "stage3" | "stage4"): string[] {
  if (stage === "stage1") {
    return getStage1ArabicTypeOptions();
  }
  if (stage === "stage2") {
    return getStage2ArabicTypeOptions();
  }
  if (stage === "stage3") {
    return getStage3ArabicTypeOptions();
  }
  return getStage4ArabicTypeOptions();
}

function main() {
  console.log("=== مقارنة أنواع Excel مع المشروع ===\n");

  const checks: { stage: string; expected: string[]; found: string[]; ok: boolean }[] = [];

  const s1 = [...sheetTypes("Stage1")].sort();
  checks.push({
    stage: "Stage1",
    expected: expectedArabicTypes("stage1"),
    found: s1.filter((t) => !t.startsWith("INVALID:")),
    ok:
      expectedArabicTypes("stage1").every((t) => s1.includes(t)) &&
      !s1.some((t) => t.startsWith("INVALID:")),
  });

  const s2 = [...sheetTypes("Stage2")].sort();
  checks.push({
    stage: "Stage2",
    expected: expectedArabicTypes("stage2"),
    found: s2.filter((t) => !t.startsWith("INVALID:")),
    ok:
      expectedArabicTypes("stage2").every((t) => s2.includes(t)) &&
      !s2.some((t) => t.startsWith("INVALID:")),
  });

  const s3 = [...sheetTypes("Stage3")].sort();
  checks.push({
    stage: "Stage3",
    expected: expectedArabicTypes("stage3"),
    found: s3.filter((t) => !t.startsWith("INVALID:")),
    ok: !s3.some((t) => t.startsWith("INVALID:")),
  });

  const s4 = [...sheetTypes("Stage4")].sort();
  checks.push({
    stage: "Stage4",
    expected: expectedArabicTypes("stage4"),
    found: s4.filter((t) => !t.startsWith("INVALID:")),
    ok: !s4.some((t) => t.startsWith("INVALID:")),
  });

  checks.forEach((check) => {
    console.log(`${check.stage}:`);
    console.log(`  مطلوب: ${check.expected.join(", ")}`);
    console.log(`  موجود: ${check.found.join(", ") || "(لا شيء)"}`);
    console.log(`  ${check.ok ? "✓ متطابق" : "✗ غير متطابق"}\n`);
  });

  const allOk = checks.every((c) => c.ok);
  if (!allOk) {
    process.exit(1);
  }
  console.log("كل الأنواع متطابقة 100% مع المشروع.");
}

main();
