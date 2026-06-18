"use client";

import { useState } from "react";
import competitionLogo from "@/features/team/assets/competition-logo-white-transparent.png";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { confirmTeamReady } from "@/features/team/confirm-team-ready";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";
import { TeamArchivePanel } from "@/features/facilitator/components/team-archive-panel";
import { firebaseAuth } from "@/firebase/firebaseClient";
import type { TeamPlayer } from "@/types";

const COMPETITION_NAME = "سفراء المسيح";
const COMPETITION_SLOGAN = "نحيا بالكلمة... ونشهد للحق";

function WaitingMessage({
  title,
  description,
  tone = "muted",
}: {
  title: string;
  description?: string;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={
        tone === "error"
          ? "team-waiting-screen__message team-waiting-screen__message--error"
          : "team-waiting-screen__message"
      }
    >
      <p className="team-waiting-screen__message-title">{title}</p>
      {description ? (
        <p className="team-waiting-screen__message-body">{description}</p>
      ) : null}
    </div>
  );
}

export function TeamWaitingScreen() {
  const { teamName, ready, players, loading, error } = useTeamCompetitionContext();
  const mainPlayers = players.filter((player) => player.type === "main");
  const substitutePlayers = players.filter((player) => player.type === "substitute");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleReady() {
    if (ready || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await confirmTeamReady();
    } catch {
      setSaveError("تعذر تسجيل الجاهزية. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="team-waiting-screen">
        <WaitingMessage title="جاري التحميل..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-waiting-screen">
        <WaitingMessage title="تعذر تحميل بيانات الفريق" description={error} tone="error" />
      </div>
    );
  }

  return (
    <div className="team-waiting-screen">
      <div className="team-waiting-screen__logo-wrap">
        <img
          src={competitionLogo.src}
          alt={`شعار ${COMPETITION_NAME}`}
          width={competitionLogo.width}
          height={competitionLogo.height}
          decoding="async"
          fetchPriority="high"
          className="team-waiting-screen__logo"
        />
      </div>

      <h1 className="team-waiting-screen__title">{COMPETITION_NAME}</h1>
      <p className="team-waiting-screen__slogan">{COMPETITION_SLOGAN}</p>

      <p className="team-waiting-screen__team-name">{teamName}</p>

      {players.length > 0 ? (
        <div className="team-waiting-screen__players">
          <p className="team-waiting-screen__players-label">لاعبو الفريق</p>
          <div className="team-waiting-screen__players-grid">
            {mainPlayers.map((player) => (
              <PlayerChip key={`main-${player.name}`} player={player} />
            ))}
            {substitutePlayers.map((player) => (
              <PlayerChip key={`sub-${player.name}`} player={player} />
            ))}
          </div>
        </div>
      ) : null}

      <p className="team-waiting-screen__hint">
        {ready
          ? "أنتم جاهزون — بانتظار بدء المسابقة من الميسر"
          : "اضغطوا جاهز عندما يكون فريقكم مستعداً للانطلاق"}
      </p>

      {saveError ? (
        <div className="mt-4 w-full">
          <WaitingMessage title="تعذر التسجيل" description={saveError} tone="error" />
        </div>
      ) : null}

      <div className="team-waiting-screen__action">
        <GameReadyButton
          disabled={ready || saving}
          onClick={handleReady}
        >
          {saving ? "جاري التسجيل..." : ready ? "تم التسجيل" : "جاهز"}
        </GameReadyButton>
      </div>

      <div className="mt-6 w-full max-w-xl">
        <TeamArchivePanel
          teamId={firebaseAuth.currentUser?.uid ?? null}
          teamName={teamName}
        />
      </div>
    </div>
  );
}

function PlayerChip({ player }: { player: TeamPlayer }) {
  const isSubstitute = player.type === "substitute";

  return (
    <span className="team-waiting-screen__player">
      <span className="team-waiting-screen__player-name">
        {isSubstitute ? `${player.name} · بديل` : player.name}
      </span>
    </span>
  );
}
