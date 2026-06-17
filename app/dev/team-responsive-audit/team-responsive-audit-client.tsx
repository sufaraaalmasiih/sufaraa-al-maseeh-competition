"use client";

import { useSearchParams } from "next/navigation";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import {
  AUDIT_SCREEN_IDS,
  AuditGameplayHeaderForScreen,
  AuditScreen,
  getAuditShellConfig,
  isAuditScreenId,
  type AuditScreenId,
} from "@/app/dev/team-responsive-audit/audit-screens";
import { cn } from "@/lib/utils";

export function TeamResponsiveAuditClient() {
  const searchParams = useSearchParams();
  const screenParam = searchParams.get("screen");
  const screen: AuditScreenId = isAuditScreenId(screenParam) ? screenParam : "stage1-running";
  const chromeHidden = searchParams.get("chrome") === "0";
  const shell = getAuditShellConfig(screen);
  const header = AuditGameplayHeaderForScreen(screen);

  return (
    <div data-audit-root="1" data-audit-screen={screen}>
      {!chromeHidden ? (
        <div className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white/95 px-3 py-2 text-xs text-[#143A5A] backdrop-blur">
          <p className="font-bold">Team responsive audit — {screen}</p>
          <div className="flex flex-wrap gap-1">
            {AUDIT_SCREEN_IDS.map((id) => (
              <a
                key={id}
                href={`/dev/team-responsive-audit?screen=${id}&chrome=0`}
                className={cn(
                  "rounded-full border px-2 py-0.5",
                  id === screen ? "border-[#2388C4] bg-[#E9F6FC]" : "border-black/10",
                )}
              >
                {id}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <CompetitionGradientShell
        centerContent={shell.centerBody}
        scrollable={shell.scrollable}
        className={cn(
          "team-player-shell",
          shell.scrollable ? "app-flow-shell" : "app-viewport-fill",
          !chromeHidden && "pt-10",
        )}
        contentClassName={shell.contentClassName}
      >
        <div
          className={cn(
            "team-flow-content",
            shell.fillViewport && "team-flow-content--fill",
            shell.centerBody && "team-flow-content--center-body",
          )}
        >
          {header ? (
            <div className="team-flow-content__header">
              {header}
            </div>
          ) : null}
          <div className="team-flow-content__body">
            <AuditScreen screen={screen} />
          </div>
        </div>
      </CompetitionGradientShell>
    </div>
  );
}
