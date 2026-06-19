"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCog } from "lucide-react";
import {
  FacilitatorControlsConfirmCard,
  type ControlsConfirmRequest,
} from "@/features/facilitator/components/facilitator-controls-confirm-card";
import { FacilitatorControlsTeamProfilePanel } from "@/features/facilitator/components/facilitator-controls-team-profile-panel";
import { updateTeamFullProfile } from "@/features/facilitator/facilitator-team-admin";
import { callAdminApiOptional } from "@/lib/admin-api-client";
import { useAllRegisteredTeams } from "@/features/facilitator/use-all-teams";
import { useTeamProfile } from "@/features/facilitator/use-team-profile";
import type { TeamPlayer } from "@/types";

/**
 * إدارة الفريق (تبويب الإدارة): اختيار فريق وتعديل اسمه/محافظته/لاعبيه وبياناته.
 * نُقلت من تبويب «التحكم» إلى «الإدارة» — مكانها الصحيح بجانب بقية إدارة الفرق.
 */
export function FacilitatorAdminTeamManagementPanel() {
  const { teams, loading, error } = useAllRegisteredTeams();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const selectedTeam = useMemo(
    () => teams.find((team) => team.teamId === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  const { email, players, loading: profileLoading, error: profileError } = useTeamProfile(
    selectedTeamId || null,
  );

  const [teamName, setTeamName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", ""]);
  const [confirmRequest, setConfirmRequest] = useState<ControlsConfirmRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamName("");
      setGovernorate("");
      return;
    }
    setTeamName(selectedTeam.teamName);
    setGovernorate(selectedTeam.governorate);
  }, [selectedTeam]);

  useEffect(() => {
    setAccountEmail(email);
    setPlayerNames(players.map((player) => player.name).concat(["", "", "", "", ""]).slice(0, 5));
  }, [email, players]);

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

    setConfirmRequest({
      title: "حفظ بيانات الفريق",
      details: [
        { label: "الفريق", value: teamName.trim() },
        { label: "المحافظة", value: governorate.trim() || "غير محددة" },
        { label: "البريد", value: accountEmail.trim() || "—" },
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

        // تغيير بريد/كلمة مرور تسجيل الدخول الحقيقية يحتاج Admin SDK (خادم).
        const emailChanged =
          accountEmail.trim().length > 0 && accountEmail.trim() !== email.trim();
        const passwordSet = accountPassword.trim().length >= 6;

        if (emailChanged || passwordSet) {
          const result = await callAdminApiOptional("/api/admin/update-team-credentials", {
            teamId: selectedTeam.teamId,
            ...(emailChanged ? { email: accountEmail.trim() } : {}),
            ...(passwordSet ? { password: accountPassword.trim() } : {}),
          });
          setAccountPassword("");
          setToast(
            result.ok
              ? "تم حفظ البيانات وتحديث بيانات الدخول الفعلية."
              : `حُفظت بيانات الفريق، لكن تعذّر تحديث بيانات الدخول: ${result.error}`,
          );
          return;
        }

        setAccountPassword("");
        setToast("تم حفظ بيانات الفريق.");
      },
    });
  }

  return (
    <>
      {toast ? (
        <p className="facilitator-controls-toast facilitator-inline-success">{toast}</p>
      ) : null}

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <UserCog className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">اختيار الفريق</h3>
            <p className="facilitator-card__desc">
              اختر فريقاً من الفرق المسجّلة لتعديل بياناته.
            </p>
          </div>
        </div>
        {error ? (
          <p className="text-sm font-bold text-[#B45309]">{error}</p>
        ) : (
          <label className="facilitator-field">
            <span className="facilitator-field__label">الفريق</span>
            <select
              className="facilitator-input"
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={loading}
            >
              <option value="">— اختر فريقاً —</option>
              {teams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName} — {team.governorate}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {selectedTeam ? (
        <FacilitatorControlsTeamProfilePanel
          profileLoading={profileLoading}
          adminLoading={false}
          profileError={profileError}
          teamName={teamName}
          onTeamNameChange={setTeamName}
          governorate={governorate}
          onGovernorateChange={setGovernorate}
          accountEmail={accountEmail}
          onAccountEmailChange={setAccountEmail}
          accountPassword={accountPassword}
          onAccountPasswordChange={setAccountPassword}
          playerNames={playerNames}
          onPlayerNamesChange={setPlayerNames}
          confirmRequest={confirmRequest}
          onSaveProfile={requestSaveProfile}
        />
      ) : null}

      {confirmRequest ? (
        <FacilitatorControlsConfirmCard
          request={confirmRequest}
          onClose={() => setConfirmRequest(null)}
        />
      ) : null}
    </>
  );
}
