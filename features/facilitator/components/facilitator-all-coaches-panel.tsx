"use client";

import { useEffect, useMemo, useState } from "react";
import { updateDoc } from "firebase/firestore";
import { Eye, EyeOff, GraduationCap, Trash2 } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { coachRef } from "@/firebase/firestore";
import { callAdminApiOptional } from "@/lib/admin-api-client";
import { useAllCoaches } from "@/features/facilitator/use-all-coaches";
import { useAllRegisteredTeams } from "@/features/facilitator/use-all-teams";
import { useAuthRole } from "@/hooks/use-auth-role";

/**
 * إدارة حسابات المدربين (تبويب الإدارة، للمشرف العام): عرض كل المدربين وتعديل
 * الاسم/البريد/كلمة المرور/الفريق المرتبط، مع عرض كلمة المرور المحفوظة وحذف الحساب.
 * تعديل البريد/كلمة المرور يمرّ عبر Admin SDK (مثل الفرق تماماً).
 */
export function FacilitatorAllCoachesPanel() {
  const { role } = useAuthRole();
  const { coaches, loading, error } = useAllCoaches();
  const { teams } = useAllRegisteredTeams();

  const [selectedCoachId, setSelectedCoachId] = useState("");
  const selectedCoach = useMemo(
    () => coaches.find((coach) => coach.coachId === selectedCoachId) ?? null,
    [coaches, selectedCoachId],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedTeamId, setLinkedTeamId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showStored, setShowStored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selectedCoach) {
      setName("");
      setEmail("");
      setLinkedTeamId("");
      setNewPassword("");
      setShowStored(false);
      return;
    }
    setName(selectedCoach.name);
    setEmail(selectedCoach.email);
    setLinkedTeamId(selectedCoach.linkedTeamId);
    setNewPassword("");
    setShowStored(false);
  }, [selectedCoach]);

  const isSuperAdmin = role === "super_admin";

  async function handleSave() {
    if (!selectedCoach) {
      return;
    }
    if (!name.trim()) {
      setToast("اسم المدرب مطلوب.");
      return;
    }
    if (newPassword.trim().length > 0 && newPassword.trim().length < 6) {
      setToast("كلمة المرور الجديدة يجب أن تكون ٦ أحرف على الأقل (أو اتركها فارغة).");
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      // الاسم والفريق المرتبط = بيانات Firestore فقط (الميسّر يملك صلاحية تعديلها).
      const linkedTeam = teams.find((team) => team.teamId === linkedTeamId);
      await updateDoc(coachRef(selectedCoach.coachId), {
        name: name.trim(),
        ...(linkedTeamId
          ? {
              linkedTeamId,
              linkedTeamName: linkedTeam?.teamName ?? selectedCoach.linkedTeamName,
            }
          : {}),
      });

      // البريد/كلمة المرور = Auth عبر الخادم.
      const emailChanged = email.trim().length > 0 && email.trim() !== selectedCoach.email.trim();
      const passwordSet = newPassword.trim().length >= 6;
      if (emailChanged || passwordSet) {
        const result = await callAdminApiOptional("/api/admin/update-coach-credentials", {
          coachId: selectedCoach.coachId,
          ...(emailChanged ? { email: email.trim() } : {}),
          ...(passwordSet ? { password: newPassword.trim() } : {}),
        });
        setNewPassword("");
        setToast(
          result.ok
            ? "تم حفظ بيانات المدرب وتحديث بيانات الدخول الفعلية."
            : `حُفظ اسم المدرب، لكن تعذّر تحديث بيانات الدخول: ${result.error}`,
        );
        return;
      }

      setToast("تم حفظ بيانات المدرب.");
    } catch {
      setToast("تعذّر حفظ بيانات المدرب.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(coachId: string, coachName: string) {
    setDeleting(true);
    try {
      const result = await callAdminApiOptional<{ authDeleted?: boolean; authError?: string | null }>(
        "/api/admin/delete-coach",
        { coachId },
      );
      if (result.ok) {
        setToast(
          result.data.authDeleted
            ? `تم حذف حساب المدرب «${coachName}» نهائياً (البيانات وحساب الدخول).`
            : `تم حذف بيانات المدرب «${coachName}»، لكن لم يُحذف حساب الدخول${
                result.data.authError ? ` (السبب: ${result.data.authError})` : ""
              }.`,
        );
        if (selectedCoachId === coachId) {
          setSelectedCoachId("");
        }
      } else {
        setToast(`تعذّر حذف حساب المدرب: ${result.error}`);
      }
      setPendingDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <GraduationCap className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">حسابات المدربين ({coaches.length})</h3>
          <p className="facilitator-card__desc">
            عرض وتعديل حسابات المدربين — الاسم والبريد وكلمة المرور والفريق المرتبط.
          </p>
        </div>
      </div>

      {toast ? (
        <p className="facilitator-controls-toast facilitator-inline-success">{toast}</p>
      ) : null}

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر التحميل" description={error} /> : null}

      {!loading && !error ? (
        coaches.length === 0 ? (
          <p className="text-sm font-semibold text-[#64748B]">لا توجد حسابات مدربين بعد.</p>
        ) : (
          <>
            <label className="facilitator-field">
              <span className="facilitator-field__label">المدرب</span>
              <select
                className="facilitator-input"
                value={selectedCoachId}
                onChange={(event) => setSelectedCoachId(event.target.value)}
              >
                <option value="">— اختر مدرباً —</option>
                {coaches.map((coach) => (
                  <option key={coach.coachId} value={coach.coachId}>
                    {coach.name} — {coach.linkedTeamName || "بدون فريق"}
                  </option>
                ))}
              </select>
            </label>

            {selectedCoach ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="facilitator-field">
                    <span className="facilitator-field__label">اسم المدرب</span>
                    <input
                      className="facilitator-input"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <label className="facilitator-field">
                    <span className="facilitator-field__label">الفريق المرتبط</span>
                    <select
                      className="facilitator-input"
                      value={linkedTeamId}
                      onChange={(event) => setLinkedTeamId(event.target.value)}
                    >
                      <option value="">— اختر الفريق —</option>
                      {teams.map((team) => (
                        <option key={team.teamId} value={team.teamId}>
                          {team.teamName} — {team.governorate}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="facilitator-field">
                    <span className="facilitator-field__label">البريد الإلكتروني</span>
                    <input
                      type="email"
                      dir="ltr"
                      className="facilitator-input"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="facilitator-field">
                    <span className="facilitator-field__label">كلمة المرور الجديدة</span>
                    <input
                      type="password"
                      dir="ltr"
                      className="facilitator-input"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="6 أحرف على الأقل (اختياري)"
                    />
                    <span className="mt-1 flex items-center gap-2 text-xs font-bold text-[#475569]">
                      كلمة المرور الحالية:
                      <code dir="ltr" className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[#143A5A]">
                        {selectedCoach.passwordPlain
                          ? showStored
                            ? selectedCoach.passwordPlain
                            : "••••••••"
                          : "غير محفوظة"}
                      </code>
                      {selectedCoach.passwordPlain ? (
                        <button
                          type="button"
                          className="inline-flex items-center text-[#2388C4]"
                          onClick={() => setShowStored((value) => !value)}
                          aria-label={showStored ? "إخفاء" : "إظهار"}
                        >
                          {showStored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="facilitator-btn facilitator-btn--primary"
                    disabled={saving}
                    onClick={() => void handleSave()}
                  >
                    {saving ? "جارٍ الحفظ..." : "حفظ بيانات المدرب"}
                  </button>
                  {pendingDeleteId === selectedCoach.coachId ? (
                    <>
                      <button
                        type="button"
                        className="facilitator-btn facilitator-btn--danger"
                        disabled={deleting}
                        onClick={() => void handleDelete(selectedCoach.coachId, selectedCoach.name)}
                      >
                        {deleting ? "جارٍ الحذف..." : "تأكيد الحذف النهائي"}
                      </button>
                      <button
                        type="button"
                        className="facilitator-btn facilitator-btn--outline"
                        disabled={deleting}
                        onClick={() => setPendingDeleteId(null)}
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="facilitator-btn facilitator-btn--danger"
                      onClick={() => setPendingDeleteId(selectedCoach.coachId)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      حذف نهائي
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}
