"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  ScrollText,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  FacilitatorControlsConfirmCard,
  type ControlsConfirmRequest,
} from "@/features/facilitator/components/facilitator-controls-confirm-card";
import {
  buildSessionTitle,
  deleteSession,
  updateSessionMetadata,
  updateSessionTeams,
  useCompetitionHistory,
  useSessionEditLog,
  type ArchiveTeam,
  type CompetitionSession,
} from "@/features/facilitator/competition-session";
import { SessionEditLogPanel } from "@/features/facilitator/components/session-edit-log-panel";
import { ArchiveResultsTable } from "@/features/facilitator/components/archive-results-table";
import {
  objectionReasonLabel,
  useObjections,
  type CompetitionObjection,
} from "@/features/facilitator/objections";
import { cn } from "@/lib/utils";

function formatDate(ms: number): string {
  if (!ms) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

export function FacilitatorHistoryTab() {
  const { archives, loading, error } = useCompetitionHistory();
  const { objections } = useObjections();

  if (loading) {
    return <LoadingState variant="page" />;
  }
  if (error) {
    return <ErrorState title="تعذر تحميل السجل" description={error} />;
  }
  if (archives.length === 0) {
    return (
      <EmptyState title="لا توجد مسابقات مسجلة بعد. ابدأ مسابقة جديدة من تبويب «سير المسابقة»." />
    );
  }

  return (
    <div className="space-y-6">
      {archives.map((archive) => (
        <SessionCard
          key={archive.id}
          archive={archive}
          objections={objections.filter((objection) => objection.sessionId === archive.id)}
        />
      ))}
    </div>
  );
}

function SessionCard({
  archive,
  objections,
}: {
  archive: CompetitionSession;
  objections: CompetitionObjection[];
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState(archive.title);
  const [version, setVersion] = useState(archive.version);
  const [hostGovernorate, setHostGovernorate] = useState(archive.hostGovernorate);
  const [editingTeams, setEditingTeams] = useState(false);
  const [draftTeams, setDraftTeams] = useState<ArchiveTeam[]>(archive.teams);
  const [showEditLog, setShowEditLog] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ControlsConfirmRequest | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { entries, loading: logLoading, error: logError } = useSessionEditLog(
    showEditLog ? archive.id : null,
  );

  useEffect(() => {
    setTitle(archive.title);
    setVersion(archive.version);
    setHostGovernorate(archive.hostGovernorate);
    if (!editingTeams) {
      setDraftTeams(archive.teams);
    }
  }, [archive, editingTeams]);

  function openConfirm(request: ControlsConfirmRequest) {
    setConfirmRequest(request);
  }

  function closeConfirm() {
    setConfirmRequest(null);
  }

  function requestSaveMetadata() {
    const nextTitle = title.trim() || buildSessionTitle(version, hostGovernorate);
    openConfirm({
      title: "تعديل بيانات السجل",
      details: [
        { label: "العنوان", value: nextTitle },
        { label: "النسخة", value: version.trim() || "—" },
        { label: "المحافظة", value: hostGovernorate.trim() || "—" },
      ],
      confirmLabel: "حفظ بيانات السجل",
      onConfirm: async (reason) => {
        await updateSessionMetadata(
          archive.id,
          { title: nextTitle, version, hostGovernorate },
          reason,
        );
        setEditingMeta(false);
        setFeedback("تم حفظ بيانات السجل.");
      },
    });
  }

  function startEditTeams() {
    setDraftTeams(archive.teams);
    setEditingTeams(true);
    setFeedback(null);
  }

  function updateScore(teamId: string, key: keyof ArchiveTeam, value: string) {
    setDraftTeams((current) =>
      current.map((team) =>
        team.teamId === teamId ? { ...team, [key]: Number(value) || 0 } : team,
      ),
    );
  }

  function requestSaveTeams() {
    openConfirm({
      title: "تعديل نتائج السجل",
      details: [
        { label: "السجل", value: archive.title },
        { label: "عدد الفرق", value: String(draftTeams.length) },
        {
          label: "أعلى نتيجة",
          value: String(
            [...draftTeams].sort((first, second) => second.total - first.total)[0]?.total ?? 0,
          ),
        },
      ],
      confirmLabel: "حفظ النتائج",
      onConfirm: async (reason) => {
        await updateSessionTeams(archive.id, draftTeams, reason);
        setEditingTeams(false);
        setFeedback("تم حفظ النتائج في السجل.");
      },
    });
  }

  function requestDelete() {
    openConfirm({
      title: "حذف السجل نهائياً",
      tone: "danger",
      details: [
        { label: "السجل", value: archive.title },
        { label: "الفرق", value: String(archive.teams.length) },
      ],
      confirmLabel: "حذف السجل",
      onConfirm: async (reason) => {
        await deleteSession(archive.id, reason);
      },
    });
  }

  const teams = editingTeams ? draftTeams : archive.teams;
  const sortedTeams = [...teams].sort((first, second) => first.rank - second.rank);

  return (
    <>
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <Archive className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div className="flex-1">
            {editingMeta ? (
              <div className="space-y-3">
                <input
                  type="text"
                  className="facilitator-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="عنوان السجل"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    className="facilitator-input"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    placeholder="نسخة المسابقة"
                  />
                  <input
                    type="text"
                    className="facilitator-input"
                    value={hostGovernorate}
                    onChange={(event) => setHostGovernorate(event.target.value)}
                    placeholder="المحافظة"
                  />
                </div>
                <div className="facilitator-timer__buttons">
                  <button
                    type="button"
                    className="facilitator-btn facilitator-btn--primary"
                    onClick={requestSaveMetadata}
                  >
                    <Save className="h-4 w-4" aria-hidden />
                    تأكيد وحفظ
                  </button>
                  <button
                    type="button"
                    className="facilitator-btn facilitator-btn--outline"
                    onClick={() => {
                      setTitle(archive.title);
                      setVersion(archive.version);
                      setHostGovernorate(archive.hostGovernorate);
                      setEditingMeta(false);
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 text-right"
                onClick={() => setEditingMeta(true)}
              >
                <h3 className="facilitator-card__title">{archive.title}</h3>
                <Pencil className="h-4 w-4 text-[#2388C4]" aria-hidden />
              </button>
            )}
            <p className="facilitator-card__desc">
              بدء: {formatDate(archive.startedAtMs)}
              {archive.startedByName ? ` · ${archive.startedByName}` : ""}
              {archive.resultsSavedAtMs ? ` · آخر حفظ: ${formatDate(archive.resultsSavedAtMs)}` : ""}
              {archive.teams.length > 0 ? ` · ${archive.teams.length} فريق` : " · بانتظار النتائج"}
              {archive.resultsSavedMode
                ? ` · ${archive.resultsSavedMode === "auto" ? "حفظ تلقائي" : "حفظ يدوي"}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-black",
                  archive.status === "active"
                    ? "bg-[#2388C4]/12 text-[#2388C4]"
                    : "bg-[#4F8A10]/12 text-[#4F8A10]",
                )}
              >
                {archive.status === "active" ? "مسابقة نشطة" : "منتهية"}
              </span>
              {archive.version ? (
                <span className="rounded-full bg-[#143A5A]/6 px-3 py-1 text-xs font-bold text-[#143A5A]/70">
                  {archive.version}
                </span>
              ) : null}
              {archive.hostGovernorate ? (
                <span className="rounded-full bg-[#143A5A]/6 px-3 py-1 text-xs font-bold text-[#143A5A]/70">
                  {archive.hostGovernorate}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {sortedTeams.length > 0 ? (
          <ArchiveResultsTable
            teams={sortedTeams}
            editable={editingTeams}
            onScoreChange={updateScore}
          />
        ) : (
          <EmptyState title="لم تُحفظ النتائج النهائية بعد." />
        )}

        {objections.length > 0 ? (
          <div className="mt-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
            <h5 className="mb-2 text-sm font-black text-[#143A5A]">
              اعتراضات هذه المسابقة ({objections.length})
            </h5>
            <div className="space-y-2">
              {objections.map((objection) => (
                <div
                  key={objection.id}
                  className="rounded-lg border border-[#FDE68A] bg-white/80 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#143A5A]">
                      {objection.teamName} — {objection.questionLabel}
                    </span>
                    <span className="text-xs font-bold text-[#92400E]">
                      {objection.status === "reviewed" ? "تمت المراجعة" : "جديد"}
                    </span>
                  </div>
                  {objection.reasons.length > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
                      {objection.reasons.map(objectionReasonLabel).join(" · ")}
                    </p>
                  ) : null}
                  {objection.note ? (
                    <p className="mt-1 text-xs text-[#143A5A]">{objection.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="facilitator-timer__buttons">
          {editingTeams ? (
            <>
              <button
                type="button"
                className="facilitator-btn facilitator-btn--primary"
                onClick={requestSaveTeams}
              >
                <Save className="h-4 w-4" aria-hidden />
                تأكيد وحفظ
              </button>
              <button
                type="button"
                className="facilitator-btn facilitator-btn--outline"
                onClick={() => setEditingTeams(false)}
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={archive.teams.length === 0}
              onClick={startEditTeams}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              تعديل النتائج
            </button>
          )}
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={() => setShowEditLog((current) => !current)}
          >
            <ScrollText className="h-4 w-4" aria-hidden />
            سجل التعديلات
            {showEditLog ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            onClick={requestDelete}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            حذف السجل
          </button>
        </div>

        {showEditLog ? (
          <SessionEditLogPanel entries={entries} loading={logLoading} error={logError} />
        ) : null}

        {feedback ? <p className="facilitator-inline-success">{feedback}</p> : null}
      </div>

      {confirmRequest ? (
        <FacilitatorControlsConfirmCard request={confirmRequest} onClose={closeConfirm} />
      ) : null}
    </>
  );
}
