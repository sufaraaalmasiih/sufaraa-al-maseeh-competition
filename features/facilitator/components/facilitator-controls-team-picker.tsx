"use client";

import { UserCog } from "lucide-react";
import type { RankedStage1Team } from "@/features/stage1/stage1-ranking";

interface FacilitatorControlsTeamPickerProps {
  teams: RankedStage1Team[];
  selectedTeamId: string;
  onSelectedTeamIdChange: (teamId: string) => void;
}

export function FacilitatorControlsTeamPicker({
  teams,
  selectedTeamId,
  onSelectedTeamIdChange,
}: FacilitatorControlsTeamPickerProps) {
  return (
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
          onChange={(event) => onSelectedTeamIdChange(event.target.value)}
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
  );
}
