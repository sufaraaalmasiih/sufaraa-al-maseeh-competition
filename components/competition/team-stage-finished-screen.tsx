"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamStageFinishedScore {
  label: string;
  value: number;
  hint?: string;
  muted?: boolean;
}

interface TeamStageFinishedScreenProps {
  badge: string;
  badgeTone?: "default" | "blue" | "amber";
  title?: string;
  subtitle: string;
  scores: TeamStageFinishedScore[];
  waitTitle?: string;
  waitHint?: string;
  screenClassName?: string;
  children?: ReactNode;
}

export function TeamStageFinishedScreen({
  badge,
  badgeTone = "default",
  title = "أحسنتم!",
  subtitle,
  scores,
  waitTitle = "بانتظار توجيه الميسر",
  waitHint = "سيتم فتح المرحلة التالية عندما يوجّهكم الميسر.",
  screenClassName,
  children,
}: TeamStageFinishedScreenProps) {
  const badgeClass =
    badgeTone === "blue"
      ? "competition-stage-screen__badge competition-stage-screen__badge--blue"
      : badgeTone === "amber"
        ? "competition-stage-screen__badge competition-stage-screen__badge--amber"
        : "competition-stage-screen__badge";

  const scoresLayout =
    scores.length > 1
      ? "competition-stage-screen__finished-scores competition-stage-screen__finished-scores--dual"
      : "competition-stage-screen__finished-scores";

  return (
    <section
      className={cn("competition-stage-screen competition-stage-screen--finished", screenClassName)}
    >
      <div className="competition-stage-screen__card glass-card-white">
        <span className={badgeClass}>{badge}</span>

        <div className="competition-stage-screen__finished-body">
          <div className="competition-stage-screen__finished-lead">
            <div aria-hidden className="competition-stage-screen__icon">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.4} />
            </div>
            <div className="competition-stage-screen__finished-copy">
              <h2 className="competition-stage-screen__title">{title}</h2>
              <p className="competition-stage-screen__subtitle">{subtitle}</p>
            </div>
          </div>

          {scores.length > 0 ? (
            <div className={scoresLayout}>
              {scores.map((score) => (
                <div
                  key={score.label}
                  className={
                    score.muted
                      ? "competition-stage-screen__score-card competition-stage-screen__score-card--muted"
                      : "competition-stage-screen__score-card"
                  }
                >
                  <p className="competition-stage-screen__score-label">{score.label}</p>
                  <p className="competition-stage-screen__score-value">{score.value}</p>
                  {score.hint ? (
                    <p
                      className="mt-2 text-xs font-bold sm:text-sm"
                      style={{ color: "rgba(20,58,90,0.55)" }}
                    >
                      {score.hint}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {children ? (
          <div className="competition-stage-screen__finished-extra">{children}</div>
        ) : null}

        <div className="competition-stage-screen__wait">
          <span aria-hidden className="competition-stage-screen__wait-pulse" />
          <p className="competition-stage-screen__wait-title">{waitTitle}</p>
          <p className="competition-stage-screen__wait-hint">{waitHint}</p>
        </div>
      </div>
    </section>
  );
}
