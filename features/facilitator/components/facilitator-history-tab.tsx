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
  type SessionEditLogEntry,
} from "@/features/facilitator/competition-session";
import { cn } from "@/lib/utils";

const STAGE_KEYS: { key: keyof ArchiveTeam; label: string }[] = [
  { key: "stage1", label: "م1" },
  { key: "stage2", label: "م2" },
  { key: "stage3", label: "م3" },
  { key: "stage4", label: "م4" },
];

const ACTION_LABELS: Record<string, string> = {
  session_started: "بدء المسابقة",
  results_saved: "حفظ النتائج",
  session_metadata_updated: "تعديل بيانات السجل",
  session_results_updated: "تعديل النتائج",
  session_deleted: "حذف السجل",
  adjust_team_score: "تعديل نقاط",
  update_team_profile: "تعديل بيانات فريق",
  reset_all_scores: "تصفير النقاط",
  toggle_team_stage_lock: "قفل/فتح مرحلة",
  set_team_facilitator_override: "انتقال استثنائي",
  clear_team_facilitator_override: "إلغاء انتقال استثنائي",
  delete_team_answers: "حذف إجابات",
  reset_team_competition_data: "تصفير بيانات فريق",
  delete_team_completely: "حذف فريق",
  migrate_all_teams_stage: "نقل جميع الفرق",
};

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

function summarizeEditChange(entry: SessionEditLogEntry): string | null {
  if (entry.action === "session_metadata_updated") {
    const before = entry.beforeValue as Record<string, string> | undefined;
    const after = entry.afterValue as Record<string, string> | undefined;
    if (before?.title && after?.title && before.title !== after.title) {
      return `العنوان: ${before.title} ← ${after.title}`;
    }
  }

  if (entry.action === "session_results_updated") {
    const before = Array.isArray(entry.beforeValue) ? entry.beforeValue.length : 0;
    const after = Array.isArray(entry.afterValue) ? entry.afterValue.length : 0;
    return `عدد الفرق: ${before} ← ${after}`;
  }

  if (entry.teamName) {
    return entry.teamName;
  }

  return null;
}

export function FacilitatorHistoryTab() {
  const { archives, loading, error } = useCompetitionHistory();

  if (loading) {
    return <LoadingState />;
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
        <SessionCard key={archive.id} archive={archive} />
      ))}
    </div>
  );
}

function SessionCard({ archive }: { archive: CompetitionSession }) {
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
          <div className="facilitator-table-wrap">
            <table className="facilitator-table">
              <thead>
                <tr>
                  <th>المركز</th>
                  <th>الفريق</th>
                  <th>المحافظة</th>
                  {STAGE_KEYS.map((stage) => (
                    <th key={stage.key}>{stage.label}</th>
                  ))}
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team) => (
                  <tr key={team.teamId}>
                    <td className="font-bold text-[#143A5A]">{team.rank}</td>
                    <td className="font-bold text-[#143A5A]">{team.teamName}</td>
                    <td>{team.governorate}</td>
                    {STAGE_KEYS.map((stage) => (
                      <td key={stage.key}>
                        {editingTeams ? (
                          <input
                            type="number"
                            className="facilitator-input facilitator-input--delta"
                            value={team[stage.key] as number}
                            onChange={(event) =>
                              updateScore(team.teamId, stage.key, event.target.value)
                            }
                          />
                        ) : (
                          (team[stage.key] as number)
                        )}
                      </td>
                    ))}
                    <td className="font-black text-[#2388C4]">{team.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="لم تُحفظ النتائج النهائية بعد." />
        )}

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

function SessionEditLogPanel({
  entries,
  loading,
  error,
}: {
  entries: SessionEditLogEntry[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState title="تعذر تحميل سجل التعديلات" description={error} />;
  }
  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-[#143A5A]/10 bg-white/70 p-4">
        <p className="text-sm font-bold text-[#143A5A]/55">لا توجد تعديلات مسجلة بعد.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[#143A5A]/10 bg-white/70 p-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-[#2388C4]" aria-hidden />
        <h4 className="text-sm font-black text-[#143A5A]">سجل التعديلات (للقراءة فقط)</h4>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => {
          const changeSummary = summarizeEditChange(entry);
          return (
            <article
              key={entry.id}
              className="rounded-xl border border-[#143A5A]/8 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm font-black text-[#143A5A]">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </strong>
                <span className="text-xs font-bold text-[#143A5A]/45">
                  {formatDate(entry.createdAtMs)}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-[#143A5A]/75">
                {entry.facilitatorName}
                {entry.teamName ? ` · ${entry.teamName}` : ""}
              </p>
              {changeSummary ? (
                <p className="mt-2 text-sm leading-7 text-[#143A5A]/70">{changeSummary}</p>
              ) : null}
              {entry.reason ? (
                <p className="mt-2 text-sm leading-7 text-[#143A5A]/80">
                  <span className="font-black">السبب:</span> {entry.reason}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
