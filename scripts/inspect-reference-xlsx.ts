import fs from "node:fs";
import * as XLSX from "xlsx";

const path = "C:/Users/ASUS/Downloads/sufaraa_christ_question_bank_current (1).xlsx";

if (!fs.existsSync(path)) {
  console.error("File not found:", path);
  process.exit(1);
}

const workbook = XLSX.read(fs.readFileSync(path));
console.log("Sheets:", workbook.SheetNames.join(" | "));

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const ref = sheet["!ref"] ?? "A1";
  const range = XLSX.utils.decode_range(ref);
  console.log(`\n=== ${name} ===`);
  console.log(`Range: ${ref} (${range.e.r + 1} rows x ${range.e.c + 1} cols)`);

  const cols = sheet["!cols"] as { wch?: number; width?: number }[] | undefined;
  if (cols?.length) {
    console.log("Col widths:", cols.map((c) => c.wch ?? c.width ?? "?").join(", "));
  }

  const merges = sheet["!merges"] as { s: { r: number; c: number }; e: { r: number; c: number } }[] | undefined;
  if (merges?.length) {
    console.log("Merges:", merges.length, "first:", JSON.stringify(merges[0]));
  }

  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
  });

  rows.slice(0, 15).forEach((row, index) => {
    console.log(`${index + 1}: ${JSON.stringify(row)}`);
  });
}
