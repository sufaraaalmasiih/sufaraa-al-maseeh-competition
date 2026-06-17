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
import { cn } from "@/lib/utils";
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
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل توزيع المجالات" description={error} />;
  }

  if (roles.locked) {
    return (
      <div className="stage2-role-assignment-screen">
        <article className="stage2-role-assignment-screen__card stage2-role-assignment-screen__card--locked">
          <div aria-hidden className="stage2-role-assignment-screen__success-icon">
            <span>✓</span>
          </div>
          <p className="stage2-role-assignment-screen__locked-title">تم تثبيت توزيع المجالات</p>
        </article>
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
    setSelection((current) => ({
      ...current,
      [field]: current[field] === playerName ? "" : playerName,
    }));
    setSaveError(null);
  }

  return (
    <div className="stage2-role-assignment-screen">
      <StageHeaderBar
        segments={[
          { text: "فتشوا الكتب", accent: true },
          { text: "توزيع المجالات" },
        ]}
      />

      <article className="stage2-role-assignment-screen__card">
        <p className="stage2-role-assignment-screen__title">اختاروا اللاعب لكل مجال</p>

        <div className="stage2-role-assignment-screen__grid">
          {stage2RoleFields.map((field) => {
            const availablePlayers = getPlayersForField(field.key, selection, players);
            const selectedName = selection[field.key];

            return (
              <section key={field.key} className="stage2-role-field">
                <h3 className="stage2-role-field__label">{field.label}</h3>
                {availablePlayers.length === 0 ? (
                  <p className="stage2-role-field__empty">لا يوجد لاعبون متاحون لهذا المجال</p>
                ) : (
                  <div className="stage2-role-field__players" role="listbox" aria-label={field.label}>
                    {availablePlayers.map((player) => {
                      const isSelected = selectedName === player.name;

                      return (
                        <button
                          key={`${field.key}-${player.name}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            "stage2-role-player-chip",
                            isSelected && "stage2-role-player-chip--selected",
                            player.type === "substitute" && "stage2-role-player-chip--substitute",
                          )}
                          onClick={() => selectPlayer(field.key, player.name)}
                        >
                          <span className="stage2-role-player-chip__name">{player.name}</span>
                          {player.type === "substitute" ? (
                            <span className="stage2-role-player-chip__badge">بديل</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {players.length === 0 ? (
          <p className="stage2-role-assignment-screen__notice">
            لا توجد أسماء لاعبين متاحة لهذا الفريق.
          </p>
        ) : null}

        {saveError ? (
          <p className="stage2-role-assignment-screen__error">{saveError}</p>
        ) : null}
      </article>

      <CompetitionConfirmButton
        disabled={!allUniqueSelected || saving}
        onClick={saveRoles}
      >
        {saving ? "جاري حفظ التوزيع..." : "تأكيد وتثبيت التوزيع"}
      </CompetitionConfirmButton>
    </div>
  );
}
