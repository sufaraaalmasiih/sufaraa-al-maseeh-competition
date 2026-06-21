"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ANSWER_STAGE_FILTERS,
  OVERRIDE_STATUS_OPTIONS,
  STAGE_OPTIONS_LABELS,
} from "@/features/facilitator/facilitator-controls-copy";
import {
  clearTeamFacilitatorOverride,
  deleteTeamAnswers,
  deleteTeamCompletely,
  removeTeamFromCompetition,
  resetTeamCompetitionData,
  setTeamFacilitatorOverride,
  setTeamStageScores,
  toggleTeamStageLock,
  updateTeamFullProfile,
  type AdminStageKey,
} from "@/features/facilitator/facilitator-team-admin";
import { resetTimerForExceptionalReturn } from "@/features/facilitator/reset-timer-for-override";
import {
  validateOverrideQuestionNumber,
  overrideQuestionNumberToIndex,
} from "@/features/facilitator/facilitator-controls-question-limits";
import type { ControlsConfirmRequest } from "@/features/facilitator/components/facilitator-controls-confirm-card";
import { STAGE3_QUESTION_OPTIONS } from "@/features/facilitator/components/facilitator-controls-constants";
import { useActiveSessionEditLog } from "@/features/facilitator/competition-session";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useAllTeamStageLocksSummary } from "@/features/facilitator/use-all-team-stage-locks";
import { useAnswersLog } from "@/features/facilitator/use-answers-log";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";
import { useTeamAdminState } from "@/features/facilitator/use-team-admin-state";
import type { ScoreEditValues } from "@/features/facilitator/components/facilitator-controls-score-edit-panel";
import { useTeamProfile } from "@/features/facilitator/use-team-profile";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import type { GameFlowStatus } from "@/types";
import type { TeamPlayer } from "@/types";

export function useFacilitatorControlsTab() {
  const { stage4QuestionCount, status } = useGameFlow();
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
  const { docs: teamStateDocs } = useTeamStatesSnapshot("main");

  const currentScores = useMemo(() => {
    const doc = teamStateDocs.find((entry) => entry.id === selectedTeamId);
    const stages = (doc?.data.stageScores as Record<string, number> | undefined) ?? {};
    const toNum = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
    return {
      stage1: toNum(stages.stage1),
      stage2: toNum(stages.stage2),
      stage3: toNum(stages.stage3),
      stage4: toNum(stages.stage4),
      total: toNum(doc?.data.totalScore),
    };
  }, [teamStateDocs, selectedTeamId]);

  const [scoreInputs, setScoreInputs] = useState<ScoreEditValues>({
    stage1: "0",
    stage2: "0",
    stage3: "0",
    stage4: "0",
  });

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
  const [showEditLog, setShowEditLog] = useState(false);
  const { entries: editLogEntries, loading: editLogLoading, error: editLogError } =
    useActiveSessionEditLog();

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

  // القيم الافتراضية = النقاط الحالية. تُعاد التهيئة عند تغيير الفريق أو بعد حفظ
  // (يتغيّر المجموع المحفوظ)، فلا تُكتب فوق ما يكتبه المشرف أثناء التعديل.
  useEffect(() => {
    setScoreInputs({
      stage1: String(currentScores.stage1),
      stage2: String(currentScores.stage2),
      stage3: String(currentScores.stage3),
      stage4: String(currentScores.stage4),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, currentScores.total]);

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

  function resetScoreInputsToCurrent() {
    setScoreInputs({
      stage1: String(currentScores.stage1),
      stage2: String(currentScores.stage2),
      stage3: String(currentScores.stage3),
      stage4: String(currentScores.stage4),
    });
  }

  function requestSaveScores() {
    if (!selectedTeam) {
      setToast("اختر فريقاً أولاً.");
      return;
    }

    const parsed: Record<AdminStageKey, number> = {
      stage1: Math.max(0, Math.round(Number(scoreInputs.stage1))),
      stage2: Math.max(0, Math.round(Number(scoreInputs.stage2))),
      stage3: Math.max(0, Math.round(Number(scoreInputs.stage3))),
      stage4: Math.max(0, Math.round(Number(scoreInputs.stage4))),
    };

    const invalid = (["stage1", "stage2", "stage3", "stage4"] as AdminStageKey[]).some(
      (stage) => !Number.isFinite(Number(scoreInputs[stage])),
    );
    if (invalid) {
      setToast("أدخل أرقاماً صحيحة لكل مرحلة.");
      return;
    }

    const stageLabels: Record<AdminStageKey, string> = {
      stage1: "المرحلة 1",
      stage2: "المرحلة 2",
      stage3: "المرحلة 3",
      stage4: "المرحلة 4",
    };
    const nextTotal = parsed.stage1 + parsed.stage2 + parsed.stage3 + parsed.stage4;

    openConfirm({
      title: "تعديل نقاط الفريق",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        ...(["stage1", "stage2", "stage3", "stage4"] as AdminStageKey[]).map((stage) => ({
          label: stageLabels[stage],
          value: `${currentScores[stage]} ← ${parsed[stage]}`,
        })),
        { label: "المجموع", value: `${currentScores.total} ← ${nextTotal}` },
      ],
      confirmLabel: "حفظ النقاط",
      onConfirm: async (reason) => {
        await setTeamStageScores({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          stageScores: parsed,
          reason,
        });
        setToast("تم تعديل نقاط الفريق وحفظه في الأرشيف.");
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
        // عودة استثنائية: أعد تشغيل مؤقت الإجابة لتلك المرحلة إن كان منتهياً.
        await resetTimerForExceptionalReturn(
          selectedOverrideOption.status as GameFlowStatus,
        );
        setToast("تم إرسال الفريق إلى الشاشة المختارة.");
      },
    });
  }

  async function requestResetTeamTimer() {
    if (!status) {
      return;
    }
    try {
      await resetTimerForExceptionalReturn(status, true);
      setToast("تم إعادة ضبط مؤقت المرحلة الحالية.");
    } catch {
      setToast("تعذّر إعادة ضبط المؤقت — تحقّق أنك في مرحلة إجابة.");
    }
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

  function requestRemoveTeamFromCompetition() {
    if (!selectedTeam) return;

    openConfirm({
      title: "إخراج الفريق من المسابقة",
      tone: "danger",
      details: [
        { label: "الفريق", value: selectedTeam.teamName },
        { label: "يحدث", value: "يخرج الفريق من اللعب الحالي ولا يظهر في المسابقة" },
        { label: "يبقى", value: "حساب الدخول وملف الفريق — يمكنه التسجيل/العودة لاحقاً" },
      ],
      confirmLabel: "إخراج من المسابقة",
      onConfirm: async (reason) => {
        await removeTeamFromCompetition({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          reason,
        });
        setSelectedTeamId("");
        setToast("تم إخراج الفريق من المسابقة الحالية دون حذف حسابه.");
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
          value: "يُحذف حساب الدخول في Firebase أيضاً",
        },
      ],
      confirmLabel: "حذف الفريق نهائياً",
      onConfirm: async (reason) => {
        const result = await deleteTeamCompletely({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          reason,
        });
        setSelectedTeamId("");
        setToast(
          result.authDeleted
            ? "تم حذف الفريق بالكامل من المسابقة وحساب الدخول."
            : "تم حذف بيانات الفريق من المسابقة. لحذف حساب الدخول أيضاً، أضف FIREBASE_SERVICE_ACCOUNT على Vercel.",
        );
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

  return {
    teams,
    loading,
    error,
    toast,
    selectedTeamId,
    setSelectedTeamId,
    selectedTeam,
    confirmRequest,
    closeConfirm,
    profileLoading,
    profileError,
    adminLoading,
    teamName,
    setTeamName,
    governorate,
    setGovernorate,
    accountEmail,
    setAccountEmail,
    accountPassword,
    setAccountPassword,
    playerNames,
    setPlayerNames,
    currentScores,
    scoreInputs,
    setScoreInputs,
    resetScoreInputsToCurrent,
    requestSaveScores,
    globalLocks,
    globalLocksMixed,
    globalLocksLoading,
    stageLocks,
    override,
    overrideStatusKey,
    setOverrideStatusKey,
    overrideQuestionNumber,
    setOverrideQuestionNumber,
    overrideStage3QuestionId,
    setOverrideStage3QuestionId,
    selectedOverrideOption,
    overrideQuestionScope,
    overrideQuestionValidation,
    answerFilter,
    setAnswerFilter,
    showAnswers,
    setShowAnswers,
    filteredAnswers,
    answersLoading,
    showEditLog,
    setShowEditLog,
    editLogEntries,
    editLogLoading,
    editLogError,
    requestSaveProfile,
    requestApplyOverride,
    requestClearOverride,
    requestResetTeamTimer,
    requestToggleLock,
    requestResetTeamData,
    requestRemoveTeamFromCompetition,
    requestDeleteTeamCompletely,
    requestDeleteAnswers,
  };
}

export type UseFacilitatorControlsTabReturn = ReturnType<typeof useFacilitatorControlsTab>;
