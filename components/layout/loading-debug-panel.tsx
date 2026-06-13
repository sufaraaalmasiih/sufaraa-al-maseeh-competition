"use client";

import { usePathname } from "next/navigation";
import { memo, useEffect } from "react";
import { useSyncExternalStore } from "react";
import { isLoadingDebugPanelEnabled } from "@/lib/debug-flags";
import {
  getLoadingDebugServerSnapshot,
  getLoadingDebugSnapshot,
  patchLoadingDebug,
  subscribeLoadingDebug,
} from "@/lib/loading-debug-store";

function useLoadingDebugSnapshot() {
  return useSyncExternalStore(
    subscribeLoadingDebug,
    getLoadingDebugSnapshot,
    getLoadingDebugServerSnapshot,
  );
}

interface LoadingDebugPanelProps {
  waitingComponent?: string;
}

function LoadingDebugPanelInner({ waitingComponent }: LoadingDebugPanelProps) {
  const pathname = usePathname();
  const debug = useLoadingDebugSnapshot();

  useEffect(() => {
    patchLoadingDebug({
      route: pathname,
      waitingComponent: waitingComponent ?? debug.waitingComponent,
    });
  }, [pathname, waitingComponent, debug.waitingComponent]);

  const rows: Array<[string, string]> = [
    ["route", debug.route || pathname],
    ["authLoading", String(debug.authLoading)],
    ["user uid", debug.userUid ?? "(none)"],
    ["role", debug.role ?? "(none)"],
    ["teamLoading", String(debug.teamLoading)],
    ["gameFlowLoading", String(debug.gameFlowLoading)],
    ["timerLoading", String(debug.timerLoading)],
    ["stage1ProgressLoading", String(debug.stage1ProgressLoading)],
    ["stage2ProgressLoading", String(debug.stage2ProgressLoading)],
    ["gameFlow.status", debug.gameFlowStatus ?? "(none)"],
    ["waiting component", waitingComponent ?? debug.waitingComponent ?? "(unknown)"],
    ["authStateReady", debug.authStateReady || "pending"],
    ["authCallbackFired", String(debug.authCallbackFired)],
    ["authBlocking", debug.authBlockingCondition || "(none)"],
    ["last log", debug.lastLog || "(none)"],
  ];

  return (
    <div
      dir="ltr"
      className="mt-6 rounded-lg border border-amber-500/60 bg-amber-50 p-4 text-left text-xs text-amber-950"
      data-testid="real-loading-debug-panel"
    >
      <p className="mb-2 font-mono font-bold text-amber-900">[REAL LOADING DEBUG] panel (dev only)</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-semibold">{label}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export const LoadingDebugPanel = memo(function LoadingDebugPanel({
  waitingComponent,
}: LoadingDebugPanelProps) {
  if (!isLoadingDebugPanelEnabled()) {
    return null;
  }

  return <LoadingDebugPanelInner waitingComponent={waitingComponent} />;
});
