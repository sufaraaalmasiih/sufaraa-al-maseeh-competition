"use client";

import { useMemo, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { TeamArchivePanel } from "@/features/facilitator/components/team-archive-panel";
import { useAllRegisteredTeams } from "@/features/facilitator/use-all-teams";
import { deleteTeamCompletely } from "@/features/facilitator/facilitator-team-admin-destructive";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useAuthRole } from "@/hooks/use-auth-role";

export function FacilitatorAllTeamsPanel() {
  const { teams, loading, error } = useAllRegisteredTeams();
  const { docs: teamStateDocs } = useTeamStatesSnapshot("main");
  const { status } = useGameFlow();
  const { role } = useAuthRole();
  const logos = useTeamLogosMap();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const isSuperAdmin = role === "super_admin";
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function startDelete(teamId: string) {
    setPendingDeleteId(teamId);
    setDeleteReason("");
    setDeleteError(null);
    setFeedback(null);
  }

  function cancelDelete() {
    setPendingDeleteId(null);
    setDeleteReason("");
    setDeleteError(null);
  }

  async function confirmDelete(teamId: string, teamName: string) {
    if (deleteReason.trim().length < 3) {
      setDeleteError("اكتب سبب الحذف (٣ أحرف على الأقل).");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteTeamCompletely({
        teamId,
        teamName,
        reason: deleteReason.trim(),
      });
      setFeedback(
        result.authDeleted
          ? `تم حذف «${teamName}» نهائياً (البيانات وحساب الدخول).`
          : `تم حذف بيانات «${teamName}». لحذف حساب الدخول أيضاً أضف FIREBASE_SERVICE_ACCOUNT على Vercel.`,
      );
      setPendingDeleteId(null);
      setDeleteReason("");
    } catch {
      setDeleteError("تعذّر حذف الفريق. حاول مجدداً.");
    } finally {
      setDeleting(false);
    }
  }

  // الفرق المشاركة فعلياً في المسابقة الحالية = لها مستند teamState (لم تُخرَج).
  const participatingIds = useMemo(
    () => new Set(teamStateDocs.map((doc) => doc.id)),
    [teamStateDocs],
  );

  const competitionStarted = status !== null && status !== "waiting_players";
  // فريق «مشارك» = هناك مسابقة جارية وله بيانات مسابقة. بعد الإنهاء يصبح الجميع غير مشاركين.
  const isParticipating = (teamId: string) =>
    competitionStarted && participatingIds.has(teamId);
  const participatingCount = teams.filter((team) => isParticipating(team.teamId)).length;

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Users className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">
            كل الفرق المسجّلة ({teams.length})
          </h3>
          <p className="facilitator-card__desc">
            جميع الفرق التي أنشأت حساباً — مع أرشيف كل فريق وحالته في المسابقة الحالية.
          </p>
        </div>
      </div>

      {!competitionStarted ? (
        <p className="mb-4 rounded-xl bg-[#FFF7ED] px-4 py-3 text-sm font-bold text-[#B45309]">
          لا توجد مسابقة جارية الآن — لا أحد مشارك بعد. تبدأ المسابقة عندما يبدؤها
          الميسّر من تبويب «سير المسابقة» ويحدّد نوعها (مسابقة رسمية أو تدريب).
        </p>
      ) : (
        <p className="mb-4 rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm font-bold text-[#047857]">
          مسابقة جارية — {participatingCount} من {teams.length} فريقاً مشارك حالياً.
        </p>
      )}

      {feedback ? (
        <p className="mb-4 rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm font-bold text-[#047857]">
          {feedback}
        </p>
      ) : null}

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر التحميل" description={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {teams.length === 0 ? (
            <p className="text-sm font-semibold text-[#64748B]">لا توجد فرق مسجّلة بعد.</p>
          ) : null}
          {teams.map((team) => {
            const participating = isParticipating(team.teamId);
            const open = expandedTeamId === team.teamId;
            return (
              <div
                key={team.teamId}
                className="rounded-2xl border border-[#E2E8F0] bg-white/80 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TeamLogoBadge
                      logoUrl={logos.get(team.teamId)}
                      teamName={team.teamName}
                      variant="hud"
                    />
                    <div>
                      <p className="text-sm font-black text-[#143A5A]">{team.teamName}</p>
                      <p className="text-xs text-[#64748B]">
                        {team.governorate} · {team.playersCount} لاعب
                        {team.email ? ` · ${team.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        participating
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {participating ? "مشارك حالياً" : "غير مشارك"}
                    </span>
                    <button
                      type="button"
                      className="facilitator-btn facilitator-btn--outline"
                      onClick={() => setExpandedTeamId(open ? null : team.teamId)}
                    >
                      {open ? "إخفاء التفاصيل" : "عرض التفاصيل والأرشيف"}
                    </button>
                    {isSuperAdmin && pendingDeleteId !== team.teamId ? (
                      <button
                        type="button"
                        className="facilitator-btn facilitator-btn--danger"
                        onClick={() => startDelete(team.teamId)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        حذف نهائي
                      </button>
                    ) : null}
                  </div>
                </div>

                {isSuperAdmin && pendingDeleteId === team.teamId ? (
                  <div className="mt-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3">
                    <p className="mb-2 text-sm font-black text-[#B91C1C]">
                      حذف «{team.teamName}» نهائياً
                    </p>
                    <p className="mb-2 text-xs font-semibold text-[#7F1D1D]">
                      يُحذف: التسجيل · الملف · الإجابات · حالة المسابقة
                      {participating ? " (الفريق مشارك حالياً!)" : ""}. لا يمكن التراجع.
                    </p>
                    <textarea
                      className="gameplay-answer-input min-h-16 w-full resize-none rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm"
                      placeholder="سبب الحذف (إلزامي)"
                      value={deleteReason}
                      disabled={deleting}
                      onChange={(event) => {
                        setDeleteReason(event.target.value);
                        setDeleteError(null);
                      }}
                    />
                    {deleteError ? (
                      <p className="mt-1 text-xs font-bold text-[#B91C1C]">{deleteError}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="facilitator-btn facilitator-btn--danger"
                        disabled={deleting}
                        onClick={() => void confirmDelete(team.teamId, team.teamName)}
                      >
                        {deleting ? "جارٍ الحذف..." : "تأكيد الحذف النهائي"}
                      </button>
                      <button
                        type="button"
                        className="facilitator-btn facilitator-btn--outline"
                        disabled={deleting}
                        onClick={cancelDelete}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : null}

                {open ? (
                  <div className="mt-3">
                    <TeamArchivePanel
                      teamId={team.teamId}
                      teamName={team.teamName}
                      defaultOpen
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
