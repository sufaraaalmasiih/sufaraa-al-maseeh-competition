import { isLoadingDebugPanelEnabled } from "@/lib/debug-flags";

export interface LoadingDebugSnapshot {
  route: string;
  authLoading: boolean;
  userUid: string | null;
  role: string | null;
  teamLoading: boolean;
  gameFlowLoading: boolean;
  timerLoading: boolean;
  stage1ProgressLoading: boolean;
  stage2ProgressLoading: boolean;
  gameFlowStatus: string | null;
  waitingComponent: string;
  lastLog: string;
  lastLogAt: number;
  authStateReady: string;
  authCallbackFired: boolean;
  authBlockingCondition: string;
}

const initialState: LoadingDebugSnapshot = {
  route: "",
  authLoading: true,
  userUid: null,
  role: null,
  teamLoading: false,
  gameFlowLoading: false,
  timerLoading: false,
  stage1ProgressLoading: false,
  stage2ProgressLoading: false,
  gameFlowStatus: null,
  waitingComponent: "",
  lastLog: "",
  lastLogAt: 0,
  authStateReady: "pending",
  authCallbackFired: false,
  authBlockingCondition: "initial",
};

let snapshot: LoadingDebugSnapshot = { ...initialState };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function patchLoadingDebug(partial: Partial<LoadingDebugSnapshot>): void {
  if (!isLoadingDebugPanelEnabled()) {
    return;
  }

  snapshot = { ...snapshot, ...partial };
  emit();
}

export function getLoadingDebugSnapshot(): LoadingDebugSnapshot {
  return snapshot;
}

export function subscribeLoadingDebug(listener: () => void): () => void {
  if (!isLoadingDebugPanelEnabled()) {
    return () => undefined;
  }

  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLoadingDebugServerSnapshot(): LoadingDebugSnapshot {
  return initialState;
}
