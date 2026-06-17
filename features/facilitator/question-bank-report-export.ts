import type { WorkbookValidationReport } from "@/features/facilitator/question-bank-workbook-validation";

function formatReportText(report: WorkbookValidationReport): string {
  const lines: string[] = [
    "تقرير فحص بنك الأسئلة — سفراء المسيح",
    "========================================",
    `الحالة: ${report.valid ? "صالح" : "يوجد أخطاء"}`,
    `إجمالي الصفوف: ${report.totalRows}`,
    `الأسئلة الصالحة: ${report.totalValidQuestions}`,
    "",
    "ملخص المراحل:",
  ];

  report.stages.forEach((stage) => {
    lines.push(`- ${stage.stageLabel}: ${stage.totalQuestions} سؤال`);
    stage.types.forEach((entry) => {
      lines.push(`    · ${entry.typeLabel}: ${entry.count}`);
    });
  });

  if (report.warnings.length > 0) {
    lines.push("", `تحذيرات (${report.warnings.length}):`);
    report.warnings.forEach((warning) => {
      lines.push(
        `  صف ${warning.row} · ${warning.id} · [${warning.field}] ${warning.message}`,
      );
    });
  }

  if (report.errors.length > 0) {
    lines.push("", `أخطاء (${report.errors.length}):`);
    report.errors.forEach((error) => {
      lines.push(`  صف ${error.row} · ${error.id} · [${error.field}] ${error.message}`);
    });
  }

  if (report.previewSamples.length > 0) {
    lines.push("", "عينات معاينة:");
    report.previewSamples.forEach((sample) => {
      lines.push(
        `  ${sample.stageLabel} · ${sample.typeLabel} · ${sample.id}: ${sample.promptPreview}`,
      );
    });
  }

  return lines.join("\n");
}

export function downloadValidationReport(report: WorkbookValidationReport, fileName: string) {
  const text = formatReportText(report);
  const blob = new Blob([`\uFEFF${text}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".txt") ? fileName : `${fileName}-report.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
