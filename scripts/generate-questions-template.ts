import fs from "node:fs";
import path from "node:path";

const SOURCE = path.join(
  process.cwd(),
  "public",
  "templates",
  "sufaraa-questions-template.xlsx",
);
const OUTPUT = SOURCE;

if (!fs.existsSync(SOURCE)) {
  const fallback = path.join(
    process.env.USERPROFILE ?? "",
    "Downloads",
    "sufaraa_christ_question_bank_current (1).xlsx",
  );
  if (fs.existsSync(fallback)) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.copyFileSync(fallback, OUTPUT);
    console.log(`Copied fallback template to ${OUTPUT}`);
  } else {
    console.error("Template source not found:", SOURCE);
    process.exit(1);
  }
} else {
  console.log(`Template already present at ${OUTPUT}`);
}
