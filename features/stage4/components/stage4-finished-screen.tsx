"use client";

import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { Stage4RankingTable } from "@/features/stage4/components/stage4-ranking-table";
import { useStage4Ranking } from "@/features/stage4/use-stage4-ranking";

interface Stage4FinishedScreenProps {
  variant?: "team" | "facilitator" | "audience";
}

export function Stage4FinishedScreen({ variant = "team" }: Stage4FinishedScreenProps) {
  const { teams, loading, error } = useStage4Ranking();

  if (variant === "team") {
    return (
      <section className="competition-stage-screen">
        <div className="competition-stage-screen__card glass-card-white">
          <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
            {STAGE4_NAME}
          </span>
          <h2 className="competition-stage-screen__title">انتهت المرحلة الرابعة</h2>
          <p className="competition-stage-screen__subtitle">
            شكراً لمشاركتكم — تظهر نتائج المرحلة أدناه
          </p>
          <Stage4RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="team"
            embedded
          />
          <div className="competition-stage-screen__wait">
            <span aria-hidden className="competition-stage-screen__wait-pulse" />
            <p className="competition-stage-screen__wait-title">بانتظار النتائج النهائية</p>
            <p className="competition-stage-screen__wait-hint">
              سيعلن الميسر النتائج النهائية قريباً.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flow-workspace-panel space-y-4">
      <div className="flow-stage-outro">
        <div className="flow-stage-outro__inner">
          <p className="flow-stage-outro__kicker">{STAGE4_NAME}</p>
          <h2 className="flow-stage-outro__title">انتهت المرحلة الرابعة</h2>
          <p className="flow-stage-outro__desc">نتائج المرحلة الرابعة — استعد للنتائج النهائية.</p>
        </div>
      </div>
      <Stage4RankingTable teams={teams} loading={loading} error={error} variant={variant} />
    </div>
  );
}
