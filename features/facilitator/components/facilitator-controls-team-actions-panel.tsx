"use client";

import { useRef, useState } from "react";
import { Download, Eye, Lock, LockOpen, LogOut, RotateCcw, Trash2, Wand2 } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/state-view";
import {
  ANSWER_STAGE_FILTERS,
  OVERRIDE_STATUS_OPTIONS,
  STAGE_LOCK_OPTIONS,
  STAGE_OPTIONS_LABELS,
} from "@/features/facilitator/facilitator-controls-copy";
import {
  formatAnswerTime,
  STAGE3_QUESTION_OPTIONS,
} from "@/features/facilitator/components/facilitator-controls-constants";
import type { ControlsConfirmRequest } from "@/features/facilitator/components/facilitator-controls-confirm-card";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import type { TeamFacilitatorOverride } from "@/features/facilitator/team-control-types";
import type { useAnswersLog } from "@/features/facilitator/use-answers-log";
import { exportAnswersExcel } from "@/features/facilitator/export-answers-excel";
import { exportElementAsPng } from "@/features/facilitator/export-results-image";

type AnswerRow = ReturnType<typeof useAnswersLog>["rows"][number];

interface OverrideOption {
  status: string;
  label: string;
  needsStage3Question?: boolean;
}

interface OverrideQuestionValidation {
  valid: boolean;
  max: number;
  message: string | null;
}

interface FacilitatorControlsTeamActionsPanelProps {
  selectedTeamName: string;
  override: TeamFacilitatorOverride | null;
  overrideStatusKey: string;
  onOverrideStatusKeyChange: (value: string) => void;
  overrideQuestionScope: string | null;
  overrideQuestionNumber: string;
  onOverrideQuestionNumberChange: (value: string) => void;
  overrideQuestionValidation: OverrideQuestionValidation;
  selectedOverrideOption: OverrideOption | undefined;
  overrideStage3QuestionId: string;
  onOverrideStage3QuestionIdChange: (value: string) => void;
  stageLocks: Record<AdminStageKey, boolean>;
  answerFilter: "all" | AdminStageKey;
  onAnswerFilterChange: (value: "all" | AdminStageKey) => void;
  showAnswers: boolean;
  onShowAnswersChange: (updater: (current: boolean) => boolean) => void;
  filteredAnswers: AnswerRow[];
  answersLoading: boolean;
  confirmRequest: ControlsConfirmRequest | null;
  onApplyOverride: () => void;
  onClearOverride: () => void;
  onResetTimer: () => void;
  onToggleLock: (stage: AdminStageKey, locked: boolean) => void;
  onDeleteAnswers: () => void;
  onResetTeamData: () => void;
  onRemoveTeamFromCompetition: () => void;
}

export function FacilitatorControlsTeamActionsPanel({
  selectedTeamName,
  override,
  overrideStatusKey,
  onOverrideStatusKeyChange,
  overrideQuestionScope,
  overrideQuestionNumber,
  onOverrideQuestionNumberChange,
  overrideQuestionValidation,
  selectedOverrideOption,
  overrideStage3QuestionId,
  onOverrideStage3QuestionIdChange,
  stageLocks,
  answerFilter,
  onAnswerFilterChange,
  showAnswers,
  onShowAnswersChange,
  filteredAnswers,
  answersLoading,
  confirmRequest,
  onApplyOverride,
  onClearOverride,
  onResetTimer,
  onToggleLock,
  onDeleteAnswers,
  onResetTeamData,
  onRemoveTeamFromCompetition,
}: FacilitatorControlsTeamActionsPanelProps) {
  const answersTableRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExportExcel() {
    if (filteredAnswers.length === 0 || exporting) {
      return;
    }
    setExporting(true);
    try {
      await exportAnswersExcel({
        teamName: selectedTeamName,
        rows: filteredAnswers.map((row) => ({
          time: formatAnswerTime(row.createdAtMs),
          stage: STAGE_OPTIONS_LABELS[row.stage as AdminStageKey] ?? row.stage,
          question: row.questionText || "—",
          answer: row.answer || "—",
          correctAnswer: row.correctAnswer || "—",
          result:
            row.isCorrect === true
              ? "صحيح"
              : row.isCorrect === false
                ? "خطأ"
                : "—",
          pointsDelta: row.pointsDelta,
        })),
        filePrefix: "facilitator-answers",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportImage() {
    if (!answersTableRef.current || filteredAnswers.length === 0 || exporting) {
      return;
    }
    setExporting(true);
    try {
      await exportElementAsPng(
        answersTableRef.current,
        `facilitator-answers-${selectedTeamName || "team"}.png`,
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Wand2 className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">إجراءات فردية</h3>
          <p className="facilitator-card__desc">
            انتقال استثنائي، قفل المراحل، عرض الإجابات، أو حذف بيانات هذا الفريق
            فقط. التحكم الجماعي يبقى في تبويب «سير المسابقة».
          </p>
        </div>
      </div>

      <div className="facilitator-controls-section">
        <h4 className="facilitator-controls-section__title">انتقال استثنائي</h4>
        {override?.active ? (
          <p className="facilitator-inline-success">
            الفريق يتابع شاشة استثنائية: {override.status}. ألغِها ليعود للسير العام.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="facilitator-field">
            <span className="facilitator-field__label">الشاشة / المرحلة</span>
            <select
              className="facilitator-input"
              value={overrideStatusKey}
              onChange={(event) => onOverrideStatusKeyChange(event.target.value)}
            >
              {OVERRIDE_STATUS_OPTIONS.map((option) => (
                <option key={option.status} value={option.status}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {overrideQuestionScope ? (
            <label className="facilitator-field">
              <span className="facilitator-field__label">
                رقم السؤال (من 1 إلى {overrideQuestionValidation.max})
              </span>
              <input
                type="number"
                min={1}
                max={overrideQuestionValidation.max}
                className="facilitator-input"
                value={overrideQuestionNumber}
                onChange={(event) => onOverrideQuestionNumberChange(event.target.value)}
              />
            </label>
          ) : null}
          {overrideQuestionScope && !overrideQuestionValidation.valid ? (
            <p className="facilitator-controls-warning sm:col-span-2">
              {overrideQuestionValidation.message}
            </p>
          ) : null}
          {selectedOverrideOption?.needsStage3Question ? (
            <label className="facilitator-field sm:col-span-2">
              <span className="facilitator-field__label">سؤال على المحك</span>
              <select
                className="facilitator-input"
                value={overrideStage3QuestionId}
                onChange={(event) => onOverrideStage3QuestionIdChange(event.target.value)}
              >
                {STAGE3_QUESTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={
              confirmRequest !== null ||
              (overrideQuestionScope ? !overrideQuestionValidation.valid : false)
            }
            onClick={onApplyOverride}
          >
            إرسال الفريق للشاشة
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={confirmRequest !== null || !override?.active}
            onClick={onClearOverride}
          >
            إلغاء الانتقال الاستثنائي
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={onResetTimer}
          >
            إعادة ضبط مؤقت المرحلة الحالية
          </button>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          عند إعادة فريق بعودة استثنائية وقد انتهى وقته: اضغط «إعادة ضبط المؤقت»
          ليبدأ وقت الإجابة من جديد.
        </p>
      </div>

      <div className="facilitator-controls-section">
        <h4 className="facilitator-controls-section__title">قفل وفتح المراحل — هذا الفريق</h4>
        <div className="facilitator-controls-lock-grid">
          {STAGE_LOCK_OPTIONS.map((option) => {
            const locked = stageLocks[option.key];
            return (
              <div key={option.key} className="facilitator-controls-lock-row">
                <span>{option.label}</span>
                <div className="facilitator-timer__buttons">
                  <button
                    type="button"
                    className="facilitator-btn facilitator-btn--outline"
                    disabled={confirmRequest !== null || !locked}
                    onClick={() => onToggleLock(option.key, false)}
                  >
                    <LockOpen className="h-4 w-4" aria-hidden />
                    فتح
                  </button>
                  <button
                    type="button"
                    className="facilitator-btn facilitator-btn--danger"
                    disabled={confirmRequest !== null || locked}
                    onClick={() => onToggleLock(option.key, true)}
                  >
                    <Lock className="h-4 w-4" aria-hidden />
                    قفل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="facilitator-controls-section">
        <h4 className="facilitator-controls-section__title">إجابات الفريق</h4>
        <div className="facilitator-filter-row">
          {ANSWER_STAGE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`facilitator-chip-btn${answerFilter === option.value ? " facilitator-chip-btn--active" : ""}`}
              onClick={() => onAnswerFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={() => onShowAnswersChange((current) => !current)}
          >
            <Eye className="h-4 w-4" aria-hidden />
            {showAnswers ? "إخفاء الإجابات" : "إظهار إجابات الفريق"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={filteredAnswers.length === 0 || exporting}
            onClick={() => void handleExportExcel()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "جارٍ التصدير..." : "تنزيل Excel"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={filteredAnswers.length === 0 || exporting}
            onClick={() => void handleExportImage()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "جارٍ التصدير..." : "تنزيل صورة"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            disabled={confirmRequest !== null}
            onClick={onDeleteAnswers}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            حذف الإجابات المعروضة
          </button>
        </div>
        {showAnswers ? (
          answersLoading ? (
            <LoadingState variant="inline" />
          ) : filteredAnswers.length === 0 ? (
            <EmptyState title="لا توجد إجابات لهذا الفلتر." />
          ) : (
            <div ref={answersTableRef} className="facilitator-table-wrap">
              <table className="facilitator-table">
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>المرحلة</th>
                    <th>السؤال</th>
                    <th>الإجابة</th>
                    <th>الإجابة الصحيحة</th>
                    <th>النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnswers.map((row) => (
                    <tr key={row.id}>
                      <td>{formatAnswerTime(row.createdAtMs)}</td>
                      <td>{STAGE_OPTIONS_LABELS[row.stage as AdminStageKey] ?? row.stage}</td>
                      <td>{row.questionText}</td>
                      <td>{row.answer || "—"}</td>
                      <td>{row.correctAnswer || "—"}</td>
                      <td>
                        {row.isCorrect === true
                          ? "صحيح"
                          : row.isCorrect === false
                            ? "خطأ"
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>

      <div className="facilitator-controls-section">
        <h4 className="facilitator-controls-section__title">إخراج / حذف بيانات الفريق</h4>
        <p className="facilitator-card__desc">
          «إخراج من المسابقة» يزيل الفريق من اللعب الحالي فقط دون حذف حساب الدخول
          (يمكنه العودة لاحقاً). «حذف بيانات الفريق» يحذف النقاط والتقدم والإجابات
          مع إبقاء الحساب.
        </p>
        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={confirmRequest !== null}
            onClick={onRemoveTeamFromCompetition}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            إخراج من المسابقة (دون حذف الحساب)
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            disabled={confirmRequest !== null}
            onClick={onResetTeamData}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            حذف بيانات الفريق المختار
          </button>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          «حذف الفريق بالكامل» (حذف الحساب نهائياً) أصبح في تبويب «الإدارة».
        </p>
      </div>
    </div>
  );
}
