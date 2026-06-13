"use client";

import { serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { StageHeaderBar } from "@/components/competition/stage-header-bar";
import { teamStateRef } from "@/firebase/firestore";
import { Stage2RoleSummary } from "@/features/stage2/components/stage2-role-summary";
import {
  emptyStage2Roles,
  stage2RoleFields,
  type Stage2RoleKey,
  type Stage2Roles,
} from "@/features/stage2/stage2-types";
import { useTeamStage2Data } from "@/features/stage2/use-team-stage2-data";
import type { TeamPlayer } from "@/types";

function getPlayersForField(
  fieldKey: Stage2RoleKey,
  selection: Stage2Roles,
  players: TeamPlayer[],
): TeamPlayer[] {
  const currentValue = selection[fieldKey]?.trim();
  const takenElsewhere = new Set(
    stage2RoleFields
      .filter((field) => field.key !== fieldKey && selection[field.key])
      .map((field) => selection[field.key]),
  );

  return players.filter(
    (player) => player.name === currentValue || !takenElsewhere.has(player.name),
  );
}

function hasUniqueAssignments(selection: Stage2Roles): boolean {
  const assigned = stage2RoleFields.map((field) => selection[field.key]).filter(Boolean);
  return assigned.length === stage2RoleFields.length && new Set(assigned).size === assigned.length;
}

export function Stage2RoleAssignmentScreen() {
  const { teamId, players, roles, loading, error } = useTeamStage2Data();
  const [selection, setSelection] = useState<Stage2Roles>(emptyStage2Roles);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSelection(roles);
  }, [roles]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل توزيع المجالات" description={error} />;
  }

  if (roles.locked) {
    return (
      <div className="gameplay-stack">
        <div className="gameplay-board-card mx-auto max-w-2xl space-y-4 px-6 py-8 text-center">
          <div aria-hidden className="competition-stage-screen__icon mx-auto mt-0">
            <span className="text-3xl font-black">✓</span>
          </div>
          <p className="competition-stage-screen__title mt-0 text-2xl sm:text-3xl">
            تم تثبيت توزيع المجالات
          </p>
        </div>
        <Stage2RoleSummary roles={roles} />
      </div>
    );
  }

  const allUniqueSelected = hasUniqueAssignments(selection);

  async function saveRoles() {
    if (!teamId || !allUniqueSelected || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await updateDoc(teamStateRef("main", teamId), {
        stage2Roles: {
          matching: selection.matching,
          arrangeVerse: selection.arrangeVerse,
          completeVerse: selection.completeVerse,
          trueFalseCorrect: selection.trueFalseCorrect,
          locked: true,
          lockedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch {
      setSaveError("تعذر حفظ توزيع المجالات. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  function selectPlayer(field: Stage2RoleKey, playerName: string) {
    setSelection((current) => ({ ...current, [field]: playerName }));
    setSaveError(null);
  }

  return (
    <div className="gameplay-stack">
      <StageHeaderBar
        segments={[
          { text: "فتشوا الكتب", accent: true },
          { text: "توزيع المجالات" },
        ]}
      />
      <p className="text-center text-lg font-black text-[#143A5A] sm:text-xl">
        اختاروا اللاعب لكل مجال
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {stage2RoleFields.map((field) => (
          <label
            key={field.key}
            className="glass-card p-4"
          >
            <span className="mb-2 block text-sm font-black text-[#4F8A10]">
              {field.label}
            </span>
            <select
              className="motion-fast h-12 w-full rounded-xl border border-white/70 bg-white/60 px-3 text-base font-bold text-[#143A5A] backdrop-blur-lg"
              value={selection[field.key]}
              onChange={(event) => selectPlayer(field.key, event.target.value)}
            >
              <option value="">اختر اللاعب</option>
              {getPlayersForField(field.key, selection, players).map((player) => (
                <option key={`${field.key}-${player.name}`} value={player.name}>
                  {player.name}
                  {player.type === "substitute" ? " - بديل" : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {players.length === 0 ? (
        <p className="glass-card px-4 py-3 text-center text-sm font-bold text-[#143A5A]">
          لا توجد أسماء لاعبين متاحة لهذا الفريق.
        </p>
      ) : null}
      {saveError ? (
        <p className="glass-card px-4 py-3 text-sm font-bold text-destructive">
          {saveError}
        </p>
      ) : null}
      <CompetitionConfirmButton
        disabled={!allUniqueSelected || saving}
        onClick={saveRoles}
      >
        {saving ? "جاري حفظ التوزيع..." : "تأكيد وتثبيت التوزيع"}
      </CompetitionConfirmButton>
    </div>
  );
}
