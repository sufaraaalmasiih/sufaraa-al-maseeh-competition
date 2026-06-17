"use client";

import { cn } from "@/lib/utils";

interface GameFlowPlaceholderProps {
  title: string;
  description?: string;
  variant?: "default" | "audience";
}

export function GameFlowPlaceholder({
  title,
  description = "هذه شاشة تأسيسية فقط ضمن Sprint 1.",
  variant = "default",
}: GameFlowPlaceholderProps) {
  const isAudience = variant === "audience";

  return (
    <section
      className={cn(
        "competition-stage-screen",
        isAudience && "competition-stage-screen--audience-waiting",
      )}
    >
      <div
        className={cn(
          "competition-stage-screen__card glass-card-white",
          isAudience && "competition-stage-screen__card--audience-waiting",
        )}
      >
        {isAudience ? (
          <div className="competition-stage-screen__hero">
            <span className="competition-stage-screen__wait-pulse" aria-hidden />
            <h2 className="competition-stage-screen__title">{title}</h2>
            <p className="competition-stage-screen__subtitle">{description}</p>
          </div>
        ) : (
          <>
            <div
              aria-hidden
              className="mx-auto mb-4 h-1 w-20 rounded-full"
              style={{ background: "linear-gradient(90deg, #84CB2E, #4F8A10)" }}
            />
            <h2 className="competition-stage-screen__title">{title}</h2>
            <p className="competition-stage-screen__subtitle">{description}</p>
          </>
        )}
      </div>
    </section>
  );
}
