"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { LoadingState } from "@/components/layout/state-view";
import {
  downloadEasyBibleQuestionBank,
  downloadQuestionBankTemplate,
  parseQuestionBankWorkbookFile,
} from "@/features/facilitator/question-bank-excel-import";
import { assertQuestionBankImportAllowed, isQuestionBankImportAllowedStatus } from "@/features/facilitator/question-bank-lock";
import { downloadValidationReport } from "@/features/facilitator/question-bank-report-export";
import {
  backupCurrentQuestionBank,
  createQuestionBankArchive,
  deleteQuestionBankArchive,
  loadQuestionBankArchive,
  readCurrentQuestionBankPayload,
  saveFullQuestionBank,
  subscribeQuestionBankArchives,
  updateQuestionBankArchiveMeta,
} from "@/features/facilitator/question-bank-store";
import { exportQuestionBankToExcel } from "@/features/facilitator/export-question-bank-excel";
import { useQuestionBankRuntimeSync } from "@/features/facilitator/question-bank-runtime";
import type { FullQuestionBankPayload, QuestionBankArchiveRecord } from "@/features/facilitator/question-bank-types";
import { useStage1BankEditor } from "@/features/facilitator/stage1-question-bank-store";
import type { WorkbookValidationReport } from "@/features/facilitator/question-bank-workbook-validation";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { isTrainingMode } from "@/features/facilitator/competition-mode";

const EMPTY_BANK_PAYLOAD: FullQuestionBankPayload = {
  stage1: [],
  stage2: { matching: [], arrangeVerse: [], completeVerse: [], trueFalseCorrect: [] },
  stage3: {},
  stage4: [],
  meta: {
    bankSizes: { stage1: 0, stage2: 0, stage3: 0, stage4: 0 },
    stage2ReadingReference: "",
    stage2ReadingPassage: "",
  },
};

function ImportReportPanel({
  report,
  onDownloadReport,
}: {
  report: WorkbookValidationReport;
  onDownloadReport: () => void;
}) {
  return (
    <div className="facilitator-card facilitator-import-report">
      <div className="facilitator-card__head">
        {report.valid ? (
          <CheckCircle2 className="h-5 w-5 text-[#4F8A10]" aria-hidden />
        ) : (
          <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
        )}
        <div className="flex-1">
          <h3 className="facilitator-card__title">
            {report.valid ? "تقرير الفحص — الملف صالح" : "تقرير الفحص — يوجد أخطاء"}
          </h3>
          <p className="facilitator-card__desc">
            {report.valid
              ? `تم فحص ${report.totalRows} صفاً — ${report.totalValidQuestions} سؤالاً صالحاً.`
              : `تم فحص ${report.totalRows} صفاً — وُجد ${report.errors.length} خطأ. صحّح الملف وأعد الاستيراد.`}
          </p>
        </div>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          onClick={onDownloadReport}
        >
          <Download className="h-4 w-4" aria-hidden />
          تنزيل التقرير
        </button>
      </div>

      <div className="facilitator-import-report__grid">
        {report.stages.map((stage) => (
          <div key={stage.stage} className="facilitator-import-report__stage">
            <p className="facilitator-import-report__stage-title">
              {stage.stageLabel}
              <span className="facilitator-import-report__count">{stage.totalQuestions} سؤال</span>
            </p>
            {stage.types.length > 0 ? (
              <ul className="facilitator-import-report__types">
                {stage.types.map((entry) => (
                  <li key={`${stage.stage}-${entry.typeLabel}`}>
                    <span>{entry.typeLabel}</span>
                    <span>{entry.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="facilitator-import-report__empty">لا أسئلة في هذه المرحلة</p>
            )}
          </div>
        ))}
      </div>

      {report.warnings.length > 0 ? (
        <div className="facilitator-import-report__warnings">
          <p className="facilitator-import-report__warnings-title">
            تحذيرات ({report.warnings.length}) — الملف مقبول لكن يُفضّل المراجعة
          </p>
          <ul>
            {report.warnings.map((warning, index) => (
              <li key={`${warning.row}-${warning.field}-${index}`}>
                <strong>صف {warning.row}</strong>
                {warning.id !== "—" ? ` · ${warning.id}` : ""}
                <span>
                  [{warning.field}] {warning.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!report.valid && report.errors.length > 0 ? (
        <div className="facilitator-import-report__errors">
          <p className="facilitator-import-report__errors-title">تفاصيل الأخطاء</p>
          <ul>
            {report.errors.map((error, index) => (
              <li key={`${error.row}-${error.field}-${index}`}>
                <strong>صف {error.row}</strong>
                {error.id !== "—" ? ` · ${error.id}` : ""}
                {error.stage !== "—" ? ` · ${error.stage}` : ""}
                <span>
                  [{error.field}] {error.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.previewSamples.length > 0 ? (
        <div className="facilitator-import-report__preview">
          <p className="facilitator-import-report__preview-title">معاينة عينات</p>
          <ul>
            {report.previewSamples.map((sample) => (
              <li key={`${sample.stage}-${sample.id}`}>
                <strong>
                  {sample.stageLabel} · {sample.typeLabel} · {sample.id}
                </strong>
                <span>{sample.promptPreview}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ArchiveRow({
  archive,
  busy,
  onLoad,
  onDelete,
  onSaveMeta,
}: {
  archive: QuestionBankArchiveRecord;
  busy: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveMeta: (id: string, name: string, governorate: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(archive.name);
  const [governorate, setGovernorate] = useState(archive.governorate);

  useEffect(() => {
    setName(archive.name);
    setGovernorate(archive.governorate);
  }, [archive.name, archive.governorate]);

  return (
    <div className="facilitator-archive__item">
      <div className="facilitator-archive__meta">
        {editing ? (
          <div className="facilitator-archive__edit">
            <input
              type="text"
              className="facilitator-archive__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم الأرشيف"
            />
            <input
              type="text"
              className="facilitator-archive__input"
              value={governorate}
              onChange={(event) => setGovernorate(event.target.value)}
              placeholder="المحافظة"
            />
          </div>
        ) : (
          <>
            <p className="facilitator-archive__name">{archive.name}</p>
            <p className="facilitator-archive__sub">
              {archive.governorate ? `محافظة ${archive.governorate} · ` : ""}
              {archive.sourceFileName} · {archive.counts.total} سؤال
              {" · المرحلة الأولى: "}
              {archive.counts.stage1} · المرحلة الثانية: {archive.counts.stage2} · المرحلة الثالثة:{" "}
              {archive.counts.stage3} · المرحلة الرابعة: {archive.counts.stage4}
            </p>
          </>
        )}
      </div>
      <div className="facilitator-archive__actions">
        {editing ? (
          <>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={busy}
              onClick={() => {
                onSaveMeta(archive.id, name, governorate);
                setEditing(false);
              }}
            >
              حفظ
            </button>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={busy}
              onClick={() => {
                setName(archive.name);
                setGovernorate(archive.governorate);
                setEditing(false);
              }}
            >
              إلغاء
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={busy}
              onClick={() => onLoad(archive.id)}
            >
              تحميل
            </button>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              تعديل
            </button>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--danger"
              disabled={busy}
              onClick={() => onDelete(archive.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              حذف
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function FacilitatorQuestionBankTab() {
  useQuestionBankRuntimeSync();
  const { status, competitionMode } = useGameFlow();
  const trainingMode = isTrainingMode(competitionMode);
  const { questions, loading } = useStage1BankEditor();
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingEasyBank, setDownloadingEasyBank] = useState(false);
  const [exportingBank, setExportingBank] = useState(false);
  const [importReport, setImportReport] = useState<WorkbookValidationReport | null>(null);
  const [lastImportFileName, setLastImportFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [archives, setArchives] = useState<QuestionBankArchiveRecord[]>([]);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveName, setArchiveName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importAllowed = isQuestionBankImportAllowedStatus(status);
  const usingFirestore = (questions?.length ?? 0) > 0;

  useEffect(() => {
    return subscribeQuestionBankArchives(setArchives);
  }, []);

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setFeedback(null);
    setImporting(true);
    setLastImportFileName(file.name);

    try {
      await assertQuestionBankImportAllowed();

      const buffer = await file.arrayBuffer();
      const { payload, sheetName, validation } = await parseQuestionBankWorkbookFile(buffer);

      setImportReport(validation);

      if (!validation.valid || !payload) {
        setFeedback({
          kind: "error",
          text: `الملف يحتوي على ${validation.errors.length} خطأ. راجع تقرير الفحص أدناه وصحّح Excel ثم أعد الاستيراد.`,
        });
        return;
      }

      if (!trainingMode) {
        await backupCurrentQuestionBank("نسخة احتياطية قبل الاستيراد");
      }

      await saveFullQuestionBank(payload);

      if (!trainingMode) {
        const resolvedName =
          archiveName.trim() ||
          (governorate.trim() ? `أسئلة ${governorate.trim()}` : file.name.replace(/\.[^.]+$/, ""));
        await createQuestionBankArchive({
          name: resolvedName,
          governorate: governorate.trim(),
          sourceFileName: file.name,
          payload,
        });
      }

      const emptyParts: string[] = [];
      if (payload.stage1.length === 0) emptyParts.push("المرحلة 1");
      if (payload.stage2.matching.length === 0) emptyParts.push("م2: توصيل");
      if (payload.stage2.arrangeVerse.length === 0) emptyParts.push("م2: ترتيب الآية");
      if (payload.stage2.completeVerse.length === 0) emptyParts.push("م2: إكمال الآية");
      if (payload.stage2.trueFalseCorrect.length === 0) emptyParts.push("م2: صح/خطأ");
      if (Object.keys(payload.stage3).length === 0) emptyParts.push("المرحلة 3");
      if (payload.stage4.length === 0) emptyParts.push("المرحلة 4");

      const baseText = `تم فحص وحفظ الملف تلقائياً من ${sheetName}. ${validation.totalValidQuestions} سؤالاً نشط الآن في كل المراحل.`;
      const warnText =
        emptyParts.length > 0
          ? ` ⚠️ تنبيه: هذه الحقول فارغة وستُعرض أسئلة افتراضية بدلاً منها — أضف لها أسئلة في Excel: ${emptyParts.join("، ")}.`
          : "";

      // الاستيراد نجح فعلاً (success)، لكن التحذير بارز بالنص عند وجود حقول فارغة.
      setFeedback({
        kind: "success",
        text: baseText + warnText,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "تعذر قراءة الملف. تأكد أنه ملف Excel صالح.";
      setFeedback({ kind: "error", text: message });
      if (!(error instanceof Error) || !error.message.includes("لا يمكن استيراد")) {
        setImportReport(null);
      }
    } finally {
      setImporting(false);
    }
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    setFeedback(null);
    try {
      await downloadQuestionBankTemplate();
      setFeedback({
        kind: "success",
        text: "تم تنزيل القالب الرسمي. املأ الأوراق ثم استورد الملف كاملاً.",
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر إنشاء ملف النموذج." });
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleDownloadEasyBank() {
    setDownloadingEasyBank(true);
    setFeedback(null);
    try {
      await downloadEasyBibleQuestionBank();
      setFeedback({
        kind: "success",
        text: "تم تنزيل بنك الأسئلة السهل. استورده من «استيراد وفحص Excel» قبل بدء المسابقة.",
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر تنزيل بنك الأسئلة السهل." });
    } finally {
      setDownloadingEasyBank(false);
    }
  }

  async function handleExportCurrentBank() {
    setExportingBank(true);
    setFeedback(null);
    try {
      const payload = await readCurrentQuestionBankPayload();
      if (!payload) {
        setFeedback({
          kind: "error",
          text: "لا يوجد بنك مخصّص لتصديره — استورد ملف Excel أولاً.",
        });
        return;
      }
      const count = exportQuestionBankToExcel(payload);
      setFeedback({
        kind: "success",
        text: `تم تصدير البنك الحالي (${count} سؤالاً) إلى Excel. عدّله ثم أعد استيراده من «استيراد وفحص Excel».`,
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر تصدير البنك الحالي." });
    } finally {
      setExportingBank(false);
    }
  }

  async function handleRestoreDefault() {
    if (!window.confirm("استخدام بنك الأسئلة الافتراضي؟ سيُحذف البنك المخصص من كل المراحل.")) {
      return;
    }
    setArchiveBusy(true);
    setFeedback(null);
    try {
      await assertQuestionBankImportAllowed();
      await backupCurrentQuestionBank("نسخة قبل استعادة الافتراضي");
      await saveFullQuestionBank(EMPTY_BANK_PAYLOAD);
      setImportReport(null);
      setFeedback({ kind: "success", text: "تمت العودة إلى البنك الافتراضي لكل المراحل." });
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "تعذر استعادة الافتراضي.",
      });
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleLoadArchive(archiveId: string) {
    setArchiveBusy(true);
    setFeedback(null);
    try {
      await assertQuestionBankImportAllowed();
      await backupCurrentQuestionBank("نسخة قبل تحميل أرشيف");
      await loadQuestionBankArchive(archiveId);
      setFeedback({ kind: "success", text: "تم تحميل الأرشيف وتفعيل بنك الأسئلة." });
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "تعذر تحميل الأرشيف.",
      });
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleDeleteArchive(archiveId: string) {
    const target = archives.find((entry) => entry.id === archiveId);
    if (!target || !window.confirm(`حذف الأرشيف «${target.name}»؟ لا يمكن التراجع.`)) {
      return;
    }
    setArchiveBusy(true);
    try {
      await deleteQuestionBankArchive(archiveId);
      setFeedback({ kind: "success", text: "تم حذف الأرشيف." });
    } catch {
      setFeedback({ kind: "error", text: "تعذر حذف الأرشيف." });
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleSaveArchiveMeta(archiveId: string, name: string, gov: string) {
    setArchiveBusy(true);
    try {
      await updateQuestionBankArchiveMeta(archiveId, { name, governorate: gov });
      setFeedback({ kind: "success", text: "تم تحديث بيانات الأرشيف." });
    } catch {
      setFeedback({ kind: "error", text: "تعذر تحديث الأرشيف." });
    } finally {
      setArchiveBusy(false);
    }
  }

  if (loading) {
    return (
      <LoadingState
        variant="page"
        title="جارٍ تجهيز بنك الأسئلة... لحظات من فضلك"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <FileSpreadsheet className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">بنك الأسئلة — قالب Excel الرسمي</h3>
            <p className="facilitator-card__desc">
              املأ قالب Excel ثم استورده. كل ملف مقبول يُحفظ تلقائياً في Firestore ويُؤرشف للتحميل
              لاحقاً (مثلاً أسئلة محافظة معينة). المرحلة الثالثة والرابعة تدعمان كل أنواع الأسئلة.
            </p>
          </div>
        </div>

        <div className="facilitator-timer__state">
          <span>
            المصدر الحالي: {usingFirestore ? "بنك مخصص (Firestore)" : "البنك الافتراضي"}
          </span>
          <span>المرحلة 1 المحفوظة: {questions?.length ?? 0} سؤال</span>
          <span>
            حالة الاستيراد:{" "}
            {importAllowed ? "مسموح (قبل بدء المسابقة)" : "مقفول أثناء المسابقة"}
          </span>
        </div>

        <div className="facilitator-archive__form">
          <label className="facilitator-archive__field">
            <span>اسم الأرشيف (اختياري)</span>
            <input
              type="text"
              className="facilitator-archive__input"
              value={archiveName}
              onChange={(event) => setArchiveName(event.target.value)}
              placeholder="مثال: أسئلة محافظة حمص 2026"
            />
          </label>
          <label className="facilitator-archive__field">
            <span>المحافظة (اختياري)</span>
            <input
              type="text"
              className="facilitator-archive__input"
              value={governorate}
              onChange={(event) => setGovernorate(event.target.value)}
              placeholder="مثال: حمص"
            />
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => void handleImport(event)}
        />

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={downloadingTemplate}
            onClick={() => void handleDownloadTemplate()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloadingTemplate ? "جارٍ التجهيز..." : "تنزيل قالب Excel الرسمي"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={downloadingEasyBank}
            onClick={() => void handleDownloadEasyBank()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloadingEasyBank ? "جارٍ التجهيز..." : "بنك سهل — الكتاب المقدس"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={importing || !importAllowed}
            onClick={() => fileInputRef.current?.click()}
            title={importAllowed ? undefined : "أوقف المسابقة أو أعد التعيين أولاً"}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {importing ? "جارٍ الفحص والحفظ..." : "استيراد وفحص Excel"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={exportingBank || !usingFirestore}
            onClick={() => void handleExportCurrentBank()}
            title={usingFirestore ? "نزّل البنك الحالي لتعديله وإعادة رفعه" : "لا يوجد بنك مخصّص بعد"}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportingBank ? "جارٍ التصدير..." : "تصدير البنك الحالي (Excel)"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            disabled={archiveBusy || !importAllowed}
            onClick={() => void handleRestoreDefault()}
          >
            استعادة الافتراضي
          </button>
        </div>

        {feedback ? (
          <p
            className={
              feedback.kind === "success"
                ? "facilitator-inline-success"
                : "facilitator-inline-error"
            }
          >
            {feedback.text}
          </p>
        ) : null}
      </div>

      {importReport ? (
        <ImportReportPanel
          report={importReport}
          onDownloadReport={() =>
            downloadValidationReport(
              importReport,
              lastImportFileName || "question-bank-validation",
            )
          }
        />
      ) : null}

      <div className="facilitator-card facilitator-archive">
        <div className="facilitator-card__head">
          <Archive className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">أرشيف الأسئلة</h3>
            <p className="facilitator-card__desc">
              كل ملف مقبول يُحفظ هنا تلقائياً. حمّل أرشيفاً في أي وقت، أو عدّل اسمه ومحافظته، أو
              احذفه.
            </p>
          </div>
        </div>

        {archives.length === 0 ? (
          <p className="facilitator-card__desc">لا يوجد أرشيف بعد. استورد ملف Excel مقبولاً أولاً.</p>
        ) : (
          <div className="facilitator-archive__list">
            {archives.map((archive) => (
              <ArchiveRow
                key={archive.id}
                archive={archive}
                busy={archiveBusy || !importAllowed}
                onLoad={(id) => void handleLoadArchive(id)}
                onDelete={(id) => void handleDeleteArchive(id)}
                onSaveMeta={(id, name, gov) => void handleSaveArchiveMeta(id, name, gov)}
              />
            ))}
          </div>
        )}
      </div>

      {!importReport && !usingFirestore ? (
        <div className="facilitator-card">
          <p className="facilitator-card__desc">
            لا يوجد بنك مخصص. نزّل القالب، املأ الأسئلة، ثم استورد الملف لعرض تقرير الفحص والحفظ
            التلقائي.
          </p>
        </div>
      ) : null}
    </div>
  );
}
