"use client";

import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";

interface Stage3FinishedScreenProps {
  variant: "facilitator" | "audience" | "team";
}

export function Stage3FinishedScreen({ variant }: Stage3FinishedScreenProps) {
  const { teams, loading, error } = useStage3Ranking();

  if (variant === "team") {
    return (
      <section className="competition-stage-screen">
        <div className="competition-stage-screen__card glass-card-white">
          <span className="competition-stage-screen__badge">{STAGE3_NAME}</span>
          <h2 className="competition-stage-screen__title">انتهت مرحلة على المحك</h2>
          <p className="competition-stage-screen__subtitle">
            ترتيب المرحلة الثالثة — بدون النتائج النهائية للمسابقة
          </p>
          <Stage3RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="team"
            embedded
          />
          <div className="competition-stage-screen__wait">
            <span aria-hidden className="competition-stage-screen__wait-pulse" />
            <p className="competition-stage-screen__wait-title">بانتظار توجيه الميسر</p>
            <p className="competition-stage-screen__wait-hint">
              سيتم فتح المرحلة التالية عندما يوجّهكم الميسر.
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
          <p className="flow-stage-outro__kicker">{STAGE3_NAME}</p>
          <h2 className="flow-stage-outro__title">انتهت مرحلة على المحك</h2>
          <p className="flow-stage-outro__desc">
            ترتيب المرحلة الثالثة فقط — بدون النتائج النهائية للمسابقة.
          </p>
        </div>
      </div>
      <Stage3RankingTable
        teams={teams}
        loading={loading}
        error={error}
        variant={variant}
        title="ترتيب مرحلة على المحك"
      />
    </div>
  );
}
