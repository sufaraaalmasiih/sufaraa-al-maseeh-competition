"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Lock,
  LockOpen,
  RotateCcw,
  Save,
  Trash2,
  UserCog,
  Wand2,
} from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  ANSWER_STAGE_FILTERS,
  OVERRIDE_STATUS_OPTIONS,
  STAGE_LOCK_OPTIONS,
  STAGE_OPTIONS_LABELS,
} from "@/features/facilitator/facilitator-controls-copy";
import {
  clearTeamFacilitatorOverride,
  deleteTeamAnswers,
  deleteTeamCompletely,
  resetTeamCompetitionData,
  setTeamFacilitatorOverride,
  toggleTeamStageLock,
  updateTeamFullProfile,
  type AdminStageKey,
} from "@/features/facilitator/facilitator-team-admin";
import {
  validateOverrideQuestionNumber,
  overrideQuestionNumberToIndex,
} from "@/features/facilitator/facilitator-controls-question-limits";
import {
  FacilitatorControlsConfirmCard,
  type ControlsConfirmRequest,
} from "@/features/facilitator/components/facilitator-controls-confirm-card";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useAllTeamStageLocksSummary } from "@/features/facilitator/use-all-team-stage-locks";
import { useAnswersLog } from "@/features/facilitator/use-answers-log";
import { useTeamAdminState } from "@/features/facilitator/use-team-admin-state";
import { useTeamProfile } from "@/features/facilitator/use-team-profile";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";
import type { GameFlowStatus } from "@/types";
import type { TeamPlayer } from "@/types";

const PLAYER_LABELS = [
  "اللاعب 1",
  "اللاعب 2",
  "اللاعب 3",
  "اللاعب 4",
  "اللاعب 5 (البديل)",
] as const;

const STAGE3_QUESTION_OPTIONS = STAGE3_BOARD_FIELDS.flatMap((field) =>
  field.questions.map((question) => ({
    id: question.id,
    label: `${field.label} — ${question.difficultyLabel} (${question.id})`,
  })),
);

function formatAnswerTime(ms: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleTimeString("ar", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function FacilitatorControlsTab() {
  const { stage4QuestionCount } = useGameFlow();
  const { teams, loading, error } = useStage1Ranking();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [confirmRequest, setConfirmRequest] = useState<ControlsConfirmRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.teamId === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );

  const { email, players, loading: profileLoading, error: profileError } =
    useTeamProfile(selectedTeamId || null);
  const { stageLocks, override, loading: adminLoading } = useTeamAdminState(
    selectedTeamId || null,
  );
  const { locks: globalLocks, mixed: globalLocksMixed, loading: globalLocksLoading } =
    useAllTeamStageLocksSummary();
  const { rows: answerRows, loading: answersLoading } = useAnswersLog();

  const [teamName, setTeamName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", ""]);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");

  const [overrideStatusKey, setOverrideStatusKey] = useState(
    OVERRIDE_STATUS_OPTIONS[0]?.status ?? "stage1_intro",
  );
  const [overrideQuestionNumber, setOverrideQuestionNumber] = useState("1");
  const [overrideStage3QuestionId, setOverrideStage3QuestionId] = useState(
    STAGE3_QUESTION_OPTIONS[0]?.id ?? "",
  );
  const [answerFilter, setAnswerFilter] = useState<"all" | AdminStageKey>("all");
  const [showAnswers, setShowAnswers] = useState(false);

  const selectedOverrideOption = useMemo(
    () => OVERRIDE_STATUS_OPTIONS.find((option) => option.status === overrideStatusKey),
    [overrideStatusKey],
  );

  const overrideQuestionScope = selectedOverrideOption?.questionIndexScope ?? null;

  const overrideQuestionValidation = useMemo(() => {
    if (!overrideQuestionScope) {
      return { valid: true, max: 0, message: null as string | null };
    }
    return validateOverrideQuestionNumber(
      overrideQuestionScope,
      Number(overrideQuestionNumber),
      stage4QuestionCount,
    );
  }, [overrideQuestionNumber, overrideQuestionScope, stage4QuestionCount]);

  const filteredAnswers = useMemo(() => {
    if (!selectedTeamId) return [];
    return answerRows.filter((row) => {
      if (row.teamId !== selectedTeamId) return false;
      if (answerFilter === "all") return true;
      return row.stage === answerFilter;
    });
  }, [answerFilter, answerRows, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamName("");
      setGovernorate("");
      setPlayerNames(["", "", "", "", ""]);
      setAccountEmail("");
      setAccountPassword("");
      return;
    }
    setTeamName(selectedTeam.teamName);
    setGovernorate(selectedTeam.governorate);
  }, [selectedTeam]);

  useEffect(() => {
    setAccountEmail(email);
    setPlayerNames(
      players.map((player) => player.name).concat(["", "", "", "", ""]).slice(0, 5),
    );
  }, [email, players]);

  function openConfirm(request: ControlsConfirmRequest) {
    setConfirmRequest(request);
  }

  function closeConfirm() {
    setConfirmRequest(null);
  }

  function requestSaveProfile() {
    if (!selectedTeam) {
      setToast("اختر فريقاً أولاً.");
      return;
    }
    if (!teamName.trim()) {
      setToast("اسم الفريق مطلوب.");
      return;
    }

    const nextPlayers: TeamPlayer[] = playerNames.map((name, index) => ({
      name: name.trim(),
      type: index === 4 ? "substitute" : "main",
    }));

    openConfirm({
      title: "حفظ بيانات الفريق",
      details: [
        { label: "الفريق", value: teamName.trim() },
        { label: "المحافظة", value: governorate.trim() || "غير محددة" },
        { label: "البريد", value: accountEmail.trim() || "—" },
        {
          label: "كلمة المرور",
          value: accountPassword.trim().length >= 6 ? "تعيين كلمة جديدة" : "بدون تغيير",
        },
        {
          label: "اللاعبون",
          value: nextPlayers.map((player) => player.name || "—").join(" · "),
        },
      ],
      confirmLabel: "حفظ بيانات الفريق",
      onConfirm: async (reason) => {
        await updateTeamFullProfile({
          teamId: selectedTeam.teamId,
          teamName: teamName.trim(),
          governorate: governorate.trim() || "غير محددة",
          players: nextPlayers,
          email: accountEmail.trim(),
          reason,
        });
        setAccountPassword("");
        setToast("تم حفظ بيانات الفريق.");
      },
    });
  }

  function requestApplyOverride() {
    if (!selectedTeam || !selectedOverrideOption) {
      setToast("اختر فريقاً أولاً.");
      return;
    }

    if (overrideQuestionScope && !overrideQuestionValidation.valid) {
      setToast(overrideQuestionValidation.message ?? "رقم السؤال غير صالح.");
      return;
    }

    const questionIndex =
      overrideQuestionScope && overrideQuestionValidation.valid
        ? overrideQuestionNumberToIndex(Number(overrideQuestionNumber))
        : undefined;

    const details = [
      { label: "الفريق", value: selectedTeam.teamName },
      { label: "الشاشة", value: selectedOverrideOption.label },
    ];

    if (overrideQuestionScope) {
      details.push({
        label: "رقم السؤال",
        value: `${overrideQuestionNumber} من ${overrideQuestionValidation.max}`,
      });
    }

    if (selectedOverrideOption.needsStage3Question) {
      const stage3Label =
        STAGE3_QUESTION_OPTIONS.find((option) => option.id === overrideStage3QuestionId)
          ?.label ?? overrideStage3QuestionId;
      details.push({ label: "سؤال على المحك", value: stage3Label });
    }

    openConfirm({
      title: "انتقال استثنائي للفريق",
      details,
      confirmLabel: "إرسال الفريق للشاشة",
      onConfirm: async (reason) => {
        await setTeamFacilitatorOverride({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          status: selectedOverrideOption.status as GameFlowStatus,
          currentStage: selectedOverrideOption.currentStage,
          stage1QuestionIndex:
            selectedOverrideOption.questionIndexScope === "stage1"
              ? questionIndex
              : undefined,
          stage2QuestionIndex:
            selectedOverrideOption.questionIndexScope === "stage2"
              ? questionIndex
              : undefined,
          stage4QuestionIndex:
            selectedOverrideOption.questionIndexScope === "stage4"
              ? questionIndex
              : undefined,
          stage3QuestionId: selectedOverrideOption.needsStage3Question
            ? overrideStage3QuestionId
            : undefined,
          reason,
        });
        setToast("تم إرسال الفريق إلى الشاشة المختارة.");
      },
    });
  }

  function requestClearOverride() {
    if (!selectedTeam || !override?.active) {
      return;
    }

    openConfirm({
      title: "إلغاء الانتقال الاستثنائي",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        { label: "الشاشة الحالية", value: override.status },
      ],
      onConfirm: async (reason) => {
        await clearTeamFacilitatorOverride({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          reason,
        });
        setToast("عاد الفريق لمتابعة سير المسابقة العام.");
      },
    });
  }

  function requestToggleLock(stage: AdminStageKey, locked: boolean) {
    const scopeLabel = selectedTeamId
      ? selectedTeam?.teamName ?? "فريق واحد"
      : "جميع الفرق";

    openConfirm({
      title: locked ? "قفل مرحلة" : "فتح مرحلة",
      tone: locked ? "danger" : "default",
      details: [
        { label: "النطاق", value: scopeLabel },
        { label: "المرحلة", value: STAGE_OPTIONS_LABELS[stage] },
        { label: "الإجراء", value: locked ? "قفل" : "فتح" },
      ],
      confirmLabel: locked ? "تأكيد القفل" : "تأكيد الفتح",
      onConfirm: async (reason) => {
        const count = await toggleTeamStageLock({
          teamId: selectedTeamId || null,
          stage,
          locked,
          reason,
        });
        setToast(
          selectedTeamId
            ? locked
              ? `تم إغلاق ${STAGE_OPTIONS_LABELS[stage]} لهذا الفريق.`
              : `تم فتح ${STAGE_OPTIONS_LABELS[stage]} لهذا الفريق.`
            : locked
              ? `تم إغلاق ${STAGE_OPTIONS_LABELS[stage]} لـ ${count} فريقاً.`
              : `تم فتح ${STAGE_OPTIONS_LABELS[stage]} لـ ${count} فريقاً.`,
        );
      },
    });
  }

  function requestResetTeamData() {
    if (!selectedTeam) return;

    openConfirm({
      title: "حذف بيانات الفريق",
      tone: "danger",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        { label: "يُحذف", value: "النقاط · التقدم · الإجابات · حالة المسابقة" },
        { label: "يبقى", value: "حساب الفريق وبياناته الأساسية" },
      ],
      confirmLabel: "حذف بيانات الفريق",
      onConfirm: async (reason) => {
        await resetTeamCompetitionData({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          governorate: selectedTeam.governorate,
          reason,
        });
        setToast("تم حذف بيانات الفريق وإعادة ضبط تقدمه.");
      },
    });
  }

  function requestDeleteTeamCompletely() {
    if (!selectedTeam) return;

    openConfirm({
      title: "حذف الفريق بالكامل",
      tone: "danger",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        { label: "يُحذف", value: "التسجيل · الملف · الإجابات · حالة المسابقة" },
        {
          label: "ملاحظة",
          value: "حساب الدخول في Firebase يبقى — احذفه من Console إن لزم",
        },
      ],
      confirmLabel: "حذف الفريق نهائياً",
      onConfirm: async (reason) => {
        await deleteTeamCompletely({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          reason,
        });
        setSelectedTeamId("");
        setToast("تم حذف الفريق بالكامل من المسابقة.");
      },
    });
  }

  function requestDeleteAnswers() {
    if (!selectedTeam) return;

    const filterLabel =
      ANSWER_STAGE_FILTERS.find((option) => option.value === answerFilter)?.label ??
      "كل المراحل";

    openConfirm({
      title: "حذف إجابات الفريق",
      tone: "danger",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        { label: "النطاق", value: filterLabel },
        { label: "عدد ظاهر", value: String(filteredAnswers.length) },
      ],
      confirmLabel: "حذف الإجابات",
      onConfirm: async (reason) => {
        const count = await deleteTeamAnswers({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          stage: answerFilter,
          reason,
        });
        setToast(`تم حذف ${count} إجابة.`);
      },
    });
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الفرق" description={error} />;
  }

  if (teams.length === 0) {
    return <EmptyState title="لا توجد فرق مسجلة حتى الآن." />;
  }

  const activeLocks = selectedTeamId ? stageLocks : globalLocks;

  return (
    <div className="space-y-6">
      {toast ? (
        <p className="facilitator-controls-toast facilitator-inline-success">{toast}</p>
      ) : null}
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <UserCog className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">اختيار الفريق</h3>
            <p className="facilitator-card__desc">
              اختر فريقاً لإدارة بياناته وإجراءاته الفردية. بدون اختيار، تُطبَّق
              إغلاق/فتح المراحل على جميع الفرق.
            </p>
          </div>
        </div>
        <label className="facilitator-field">
          <span className="facilitator-field__label">الفريق</span>
          <select
            className="facilitator-input"
            value={selectedTeamId}
            onChange={(event) => setSelectedTeamId(event.target.value)}
          >
            <option value="">— كل الفرق (إجراءات عامة) —</option>
            {teams.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName} — {team.governorate}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedTeamId ? (
        <div className="facilitator-card">
          <div className="facilitator-card__head">
            <Lock className="h-5 w-5 text-[#2388C4]" aria-hidden />
            <div>
              <h3 className="facilitator-card__title">قفل وفتح المراحل — جميع الفرق</h3>
              <p className="facilitator-card__desc">
                المرحلة المقفلة تمنع الفريق من خوضها حتى يعيد الميسر فتحها.
              </p>
            </div>
          </div>

          {globalLocksMixed ? (
            <p className="facilitator-inline-error">
              حالة القفل مختلفة بين الفرق. أي زر تضغطه يُطبَّق على الجميع.
            </p>
          ) : null}

          {globalLocksLoading ? <LoadingState /> : null}

          <div className="facilitator-controls-lock-grid">
            {STAGE_LOCK_OPTIONS.map((option) => {
              const locked = activeLocks[option.key];
              return (
                <div key={option.key} className="facilitator-controls-lock-row">
                  <span>{option.label}</span>
                  <div className="facilitator-timer__buttons">
                    <button
                      type="button"
                      className="facilitator-btn facilitator-btn--outline"
                      disabled={confirmRequest !== null || locked === false}
                      onClick={() => requestToggleLock(option.key, false)}
                    >
                      <LockOpen className="h-4 w-4" aria-hidden />
                      فتح
                    </button>
                    <button
                      type="button"
                      className="facilitator-btn facilitator-btn--danger"
                      disabled={confirmRequest !== null || locked === true}
                      onClick={() => requestToggleLock(option.key, true)}
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
      ) : null}

      {selectedTeam ? (
        <>
          <div className="facilitator-card">
            <div className="facilitator-card__head">
              <Save className="h-5 w-5 text-[#2388C4]" aria-hidden />
              <div>
                <h3 className="facilitator-card__title">إدارة الفريق</h3>
                <p className="facilitator-card__desc">
                  تعديل الاسم والمحافظة واللاعبين وبيانات الدخول.
                </p>
              </div>
            </div>

            {profileLoading || adminLoading ? <LoadingState /> : null}
            {profileError ? (
              <ErrorState title="تعذر تحميل ملف الفريق" description={profileError} />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="facilitator-field">
                <span className="facilitator-field__label">اسم الفريق</span>
                <input
                  className="facilitator-input"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
              </label>
              <label className="facilitator-field">
                <span className="facilitator-field__label">المحافظة</span>
                <input
                  className="facilitator-input"
                  value={governorate}
                  onChange={(event) => setGovernorate(event.target.value)}
                />
              </label>
              <label className="facilitator-field">
                <span className="facilitator-field__label">البريد الإلكتروني</span>
                <input
                  type="email"
                  className="facilitator-input"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                />
              </label>
              <label className="facilitator-field">
                <span className="facilitator-field__label">كلمة المرور الجديدة</span>
                <input
                  type="password"
                  className="facilitator-input"
                  value={accountPassword}
                  onChange={(event) => setAccountPassword(event.target.value)}
                  placeholder="6 أحرف على الأقل (اختياري)"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PLAYER_LABELS.map((label, index) => (
                <label key={label} className="facilitator-field">
                  <span className="facilitator-field__label">{label}</span>
                  <input
                    className="facilitator-input"
                    value={playerNames[index] ?? ""}
                    onChange={(event) =>
                      setPlayerNames((current) => {
                        const next = [...current];
                        next[index] = event.target.value;
                        return next;
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <div className="facilitator-timer__buttons">
              <button
                type="button"
                className="facilitator-btn facilitator-btn--primary"
                disabled={confirmRequest !== null}
                onClick={requestSaveProfile}
              >
                حفظ بيانات الفريق
              </button>
            </div>
          </div>

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
                    onChange={(event) => setOverrideStatusKey(event.target.value)}
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
                      onChange={(event) => setOverrideQuestionNumber(event.target.value)}
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
                      onChange={(event) => setOverrideStage3QuestionId(event.target.value)}
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
                  onClick={requestApplyOverride}
                >
                  إرسال الفريق للشاشة
                </button>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--outline"
                  disabled={confirmRequest !== null || !override?.active}
                  onClick={requestClearOverride}
                >
                  إلغاء الانتقال الاستثنائي
                </button>
              </div>
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
                          onClick={() => requestToggleLock(option.key, false)}
                        >
                          <LockOpen className="h-4 w-4" aria-hidden />
                          فتح
                        </button>
                        <button
                          type="button"
                          className="facilitator-btn facilitator-btn--danger"
                          disabled={confirmRequest !== null || locked}
                          onClick={() => requestToggleLock(option.key, true)}
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
                    onClick={() => setAnswerFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="facilitator-timer__buttons">
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--outline"
                  onClick={() => setShowAnswers((current) => !current)}
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  {showAnswers ? "إخفاء الإجابات" : "إظهار إجابات الفريق"}
                </button>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--danger"
                  disabled={confirmRequest !== null}
                  onClick={requestDeleteAnswers}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  حذف الإجابات المعروضة
                </button>
              </div>
              {showAnswers ? (
                answersLoading ? (
                  <LoadingState />
                ) : filteredAnswers.length === 0 ? (
                  <EmptyState title="لا توجد إجابات لهذا الفلتر." />
                ) : (
                  <div className="facilitator-table-wrap">
                    <table className="facilitator-table">
                      <thead>
                        <tr>
                          <th>الوقت</th>
                          <th>المرحلة</th>
                          <th>السؤال</th>
                          <th>الإجابة</th>
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
              <h4 className="facilitator-controls-section__title">حذف بيانات الفريق</h4>
              <p className="facilitator-card__desc">
                يحذف النقاط والتقدم والإجابات ويُعيد ضبط حالة المسابقة لهذا الفريق مع
                الإبقاء على حساب الفريق وبياناته الأساسية.
              </p>
              <div className="facilitator-timer__buttons">
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--danger"
                  disabled={confirmRequest !== null}
                  onClick={requestResetTeamData}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  حذف بيانات الفريق المختار
                </button>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--danger"
                  disabled={confirmRequest !== null}
                  onClick={requestDeleteTeamCompletely}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  حذف الفريق بالكامل
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {confirmRequest ? (
        <FacilitatorControlsConfirmCard request={confirmRequest} onClose={closeConfirm} />
      ) : null}
    </div>
  );
}
