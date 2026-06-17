"use client";

import { getDoc, type DocumentSnapshot } from "firebase/firestore";
import { useEffect, useSyncExternalStore } from "react";
import { gameFlowRef } from "@/firebase/firestore";
import {
  parseStage3OpenedQuestionIds,
  parseStage3UsedQuestionIds,
  parseStage3OwnerTeamId,
  parseStage3OwnerTeamName,
  parseStage3QuestionMetadata,
} from "@/features/stage3/stage3-question-metadata";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import {
  parseStage3SelectionTimeoutNotice,
  type Stage3SelectionTimeoutNotice,
} from "@/features/stage3/stage3-selection-timeout-notice";
import { parseStage4QuestionMetadata } from "@/features/stage4/stage4-question-metadata";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import { syncStage1ActiveSession } from "@/features/stage1/stage1-active-session";
import { syncStage4ActiveSession } from "@/features/stage4/stage4-active-session";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";
import { writeSessionRecovery } from "@/lib/session-recovery";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import type { GameFlow, GameFlowStatus } from "@/types";

const LISTENER_PATH = "competitions/main/system/gameFlow";
const LOAD_TIMEOUT_MS = 5_000;

interface GameFlowStoreState {
  gameFlow: GameFlow | null;
  stage3ActiveQuestion: Stage3QuestionMetadata | null;
  stage3OpenedQuestionIds: string[];
  stage3UsedQuestionIds: string[];
  stage3OwnerTeamId: string | null;
  stage3OwnerTeamName: string | null;
  stage3SelectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
  stage4ActiveQuestion: Stage4QuestionMetadata | null;
  stage4QuestionIndex: number;
  stage4QuestionCount: number;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
  loading: boolean;
  error: string | null;
}

interface GameFlowSnapshotResult {
  gameFlow: GameFlow | null;
  stage3ActiveQuestion: Stage3QuestionMetadata | null;
  stage3OpenedQuestionIds: string[];
  stage3UsedQuestionIds: string[];
  stage3OwnerTeamId: string | null;
  stage3OwnerTeamName: string | null;
  stage3SelectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
  stage4ActiveQuestion: Stage4QuestionMetadata | null;
  stage4QuestionIndex: number;
  stage4QuestionCount: number;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
  error: string | null;
}

const SERVER_SNAPSHOT: GameFlowStoreState = {
  gameFlow: null,
  stage3ActiveQuestion: null,
  stage3OpenedQuestionIds: [],
  stage3UsedQuestionIds: [],
  stage3OwnerTeamId: null,
  stage3OwnerTeamName: null,
  stage3SelectionTimeoutNotice: null,
  stage4ActiveQuestion: null,
  stage4QuestionIndex: 0,
  stage4QuestionCount: 15,
  stage2ReadingReference: "يوحنا 15: 1-17",
  stage2ReadingPassage: "",
  loading: true,
  error: null,
};

let gameFlowStore: GameFlowStoreState = { ...SERVER_SNAPSHOT };
let gameFlowListeners = new Set<() => void>();
let listenerStarted = false;
let timeoutArmed = false;
let timeoutId: number | undefined;
let unsubscribeSnapshot: (() => void) | undefined;

function publishGameFlow(next: GameFlowStoreState): void {
  const settled =
    gameFlowStore.gameFlow && next.loading
      ? { ...next, loading: false }
      : next;

  gameFlowStore = settled;
  patchLoadingDebug({
    gameFlowLoading: settled.loading,
    gameFlowStatus: settled.gameFlow?.status ?? null,
  });
  gameFlowListeners.forEach((listener) => listener());
}

function clearLoadTimeout(): void {
  timeoutArmed = false;
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  }
}

function settleGameFlowLoading(message: string, debugLabel: string, debugExtra?: Record<string, unknown>): void {
  if (!gameFlowStore.loading) {
    return;
  }

  publishGameFlow({
    ...gameFlowStore,
    loading: false,
    error: message,
  });
  clearLoadTimeout();
  realLoadingDebug("useGameFlow", debugLabel, debugExtra);
}

function scheduleLoadTimeout(): void {
  if (timeoutArmed || !gameFlowStore.loading) {
    return;
  }

  timeoutArmed = true;
  timeoutId = window.setTimeout(() => {
    timeoutId = undefined;
    timeoutArmed = false;

    if (!gameFlowStore.loading) {
      return;
    }

    settleGameFlowLoading(
      "تعذر تحميل سير المسابقة خلال المهلة. أعد تحميل الصفحة.",
      "loading false reached (timeout)",
    );
  }, LOAD_TIMEOUT_MS);
}

function parseGameFlowSnapshot(snapshot: DocumentSnapshot): GameFlowSnapshotResult {
  if (!snapshot.exists()) {
    return {
      gameFlow: {
        status: "waiting_players",
        currentStage: "none",
        currentQuestion: 0,
        competitionFrozen: false,
      },
      stage3ActiveQuestion: null,
      stage3OpenedQuestionIds: [],
      stage3UsedQuestionIds: [],
      stage3OwnerTeamId: null,
      stage3OwnerTeamName: null,
      stage3SelectionTimeoutNotice: null,
      stage4ActiveQuestion: null,
      stage4QuestionIndex: 0,
      stage4QuestionCount: 15,
      stage2ReadingReference: "يوحنا 15: 1-17",
      stage2ReadingPassage: "",
      error: null,
    };
  }

  const data = snapshot.data();
  const status = normalizeStatus(data.status);

  return {
    gameFlow: {
      status,
      currentStage: typeof data.currentStage === "string" ? data.currentStage : "none",
      currentQuestion: typeof data.currentQuestion === "number" ? data.currentQuestion : 0,
      competitionFrozen: data.competitionFrozen === true,
    },
    stage3ActiveQuestion: parseStage3QuestionMetadata(data.stage3ActiveQuestion),
    stage3OpenedQuestionIds: parseStage3OpenedQuestionIds(data.stage3OpenedQuestionIds),
    stage3UsedQuestionIds: parseStage3UsedQuestionIds(data.stage3UsedQuestionIds),
    stage3OwnerTeamId: parseStage3OwnerTeamId(data.stage3OwnerTeamId),
    stage3OwnerTeamName: parseStage3OwnerTeamName(data.stage3OwnerTeamName),
    stage3SelectionTimeoutNotice: parseStage3SelectionTimeoutNotice(
      data.stage3SelectionTimeoutNotice,
    ),
    stage4ActiveQuestion: parseStage4QuestionMetadata(data.stage4ActiveQuestion),
    stage4QuestionIndex: typeof data.stage4QuestionIndex === "number" ? data.stage4QuestionIndex : 0,
    stage4QuestionCount: typeof data.stage4QuestionCount === "number" ? data.stage4QuestionCount : 15,
    stage2ReadingReference:
      typeof data.stage2ReadingReference === "string" && data.stage2ReadingReference.trim()
        ? data.stage2ReadingReference.trim()
        : "يوحنا 15: 1-17",
    stage2ReadingPassage:
      typeof data.stage2ReadingPassage === "string" ? data.stage2ReadingPassage.trim() : "",
    error: null,
  };
}

function applyGameFlowSnapshot(
  snapshot: DocumentSnapshot,
  snapshotData?: Record<string, unknown>,
): void {
  const parsed = parseGameFlowSnapshot(snapshot);

  if (parsed.gameFlow) {
    writeSessionRecovery({
      status: parsed.gameFlow.status,
      currentStage: parsed.gameFlow.currentStage,
      competitionFrozen: parsed.gameFlow.competitionFrozen === true,
    });
  }

  if (snapshotData) {
    syncStage1ActiveSession(snapshotData);
    syncStage4ActiveSession(snapshotData);
  }

  publishGameFlow({
    gameFlow: parsed.gameFlow,
    stage3ActiveQuestion: parsed.stage3ActiveQuestion,
    stage3OpenedQuestionIds: parsed.stage3OpenedQuestionIds,
    stage3UsedQuestionIds: parsed.stage3UsedQuestionIds,
    stage3OwnerTeamId: parsed.stage3OwnerTeamId,
    stage3OwnerTeamName: parsed.stage3OwnerTeamName,
    stage3SelectionTimeoutNotice: parsed.stage3SelectionTimeoutNotice,
    stage4ActiveQuestion: parsed.stage4ActiveQuestion,
    stage4QuestionIndex: parsed.stage4QuestionIndex,
    stage4QuestionCount: parsed.stage4QuestionCount,
    stage2ReadingReference: parsed.stage2ReadingReference,
    stage2ReadingPassage: parsed.stage2ReadingPassage,
    loading: false,
    error: parsed.error,
  });
  clearLoadTimeout();
}

function startGameFlowListener(): void {
  if (typeof window === "undefined" || listenerStarted) {
    scheduleLoadTimeout();
    return;
  }

  listenerStarted = true;
  realLoadingDebug("useGameFlow", "subscribing listener", { listenerPath: LISTENER_PATH });
  patchLoadingDebug({ gameFlowLoading: true });

  if (gameFlowStore.gameFlow) {
    if (gameFlowStore.loading) {
      publishGameFlow({ ...gameFlowStore, loading: false });
    }
  } else {
    publishGameFlow({ ...gameFlowStore, loading: true, error: null });
  }

  scheduleLoadTimeout();

  void getDoc(gameFlowRef)
    .then((snapshot) => {
      realLoadingDebug("useGameFlow", "initial getDoc received", {
        exists: snapshot.exists(),
      });
      applyGameFlowSnapshot(snapshot, snapshot.exists() ? snapshot.data() : undefined);
      realLoadingDebug("useGameFlow", "loading false reached (initial getDoc)", {
        status: parseGameFlowSnapshot(snapshot).gameFlow?.status ?? null,
      });
    })
    .catch((fetchError) => {
      realLoadingDebug("useGameFlow", "initial getDoc failed", {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
      settleGameFlowLoading(
        "تعذر تحميل سير المسابقة. أعد تحميل الصفحة.",
        "loading false reached (initial getDoc error)",
        {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
      );
    });

  unsubscribeSnapshot = subscribeFirestoreDoc(
    gameFlowRef,
    (snapshot) => {
      try {
        realLoadingDebug("useGameFlow", "snapshot received", {
          listenerPath: LISTENER_PATH,
          snapshotReceived: true,
          exists: snapshot.exists(),
        });
        applyGameFlowSnapshot(snapshot, snapshot.exists() ? snapshot.data() : undefined);
        realLoadingDebug("useGameFlow", "loading false reached", {
          status: parseGameFlowSnapshot(snapshot).gameFlow?.status ?? null,
        });
      } catch (listenerError) {
        settleGameFlowLoading(
          "تعذر معالجة بيانات سير المسابقة.",
          "loading false reached (snapshot handler error)",
          {
            error:
              listenerError instanceof Error ? listenerError.message : String(listenerError),
          },
        );
      }
    },
    (listenerError) => {
      settleGameFlowLoading(
        "تعذر الاتصال بسير المسابقة في الوقت الحالي.",
        "loading false reached (listener error)",
        {
          listenerPath: LISTENER_PATH,
          snapshotReceived: false,
          error: listenerError instanceof Error ? listenerError.message : String(listenerError),
        },
      );
    },
  );
}

function subscribeGameFlowStore(listener: () => void): () => void {
  startGameFlowListener();
  gameFlowListeners.add(listener);
  return () => {
    gameFlowListeners.delete(listener);
  };
}

function getGameFlowStoreSnapshot(): GameFlowStoreState {
  return gameFlowStore;
}

function getGameFlowStoreServerSnapshot(): GameFlowStoreState {
  return SERVER_SNAPSHOT;
}

interface UseGameFlowResult {
  gameFlow: GameFlow | null;
  status: GameFlowStatus | null;
  currentStage: string | null;
  currentQuestion: number | null;
  stage3ActiveQuestion: Stage3QuestionMetadata | null;
  stage3OpenedQuestionIds: string[];
  stage3UsedQuestionIds: string[];
  stage3OwnerTeamId: string | null;
  stage3OwnerTeamName: string | null;
  stage3SelectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
  stage4ActiveQuestion: Stage4QuestionMetadata | null;
  stage4QuestionIndex: number;
  stage4QuestionCount: number;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
  competitionFrozen: boolean;
  loading: boolean;
  error: string | null;
}

export function useGameFlow(): UseGameFlowResult {
  const state = useSyncExternalStore(
    subscribeGameFlowStore,
    getGameFlowStoreSnapshot,
    getGameFlowStoreServerSnapshot,
  );

  useEffect(() => {
    startGameFlowListener();
  }, []);

  return {
    gameFlow: state.gameFlow,
    status: state.gameFlow?.status ?? null,
    currentStage: state.gameFlow?.currentStage ?? null,
    currentQuestion: state.gameFlow?.currentQuestion ?? null,
    stage3ActiveQuestion: state.stage3ActiveQuestion,
    stage3OpenedQuestionIds: state.stage3OpenedQuestionIds,
    stage3UsedQuestionIds: state.stage3UsedQuestionIds,
    stage3OwnerTeamId: state.stage3OwnerTeamId,
    stage3OwnerTeamName: state.stage3OwnerTeamName,
    stage3SelectionTimeoutNotice: state.stage3SelectionTimeoutNotice,
    stage4ActiveQuestion: state.stage4ActiveQuestion,
    stage4QuestionIndex: state.stage4QuestionIndex,
    stage4QuestionCount: state.stage4QuestionCount,
    stage2ReadingReference: state.stage2ReadingReference,
    stage2ReadingPassage: state.stage2ReadingPassage,
    competitionFrozen: state.gameFlow?.competitionFrozen === true,
    loading: state.loading,
    error: state.error,
  };
}

function normalizeStatus(value: unknown): GameFlowStatus {
  const allowed: GameFlowStatus[] = [
    "waiting_players",
    "competition_intro",
    "stage1_intro",
    "stage1_running",
    "stage1_finished",
    "stage2_intro",
    "stage2_role_assignment",
    "stage2_reading",
    "stage2_player_turns",
    "stage2_finished",
    "stage3_intro",
    "stage3_board",
    "stage3_question_open",
    "stage3_answer_closed",
    "stage3_reveal",
    "stage3_results_done",
    "stage3_finished",
    "stage4_intro",
    "stage4_waiting_question",
    "stage4_question_open",
    "stage4_answers_closed",
    "stage4_reveal",
    "stage4_finished",
    "final_results",
    "podium",
  ];

  return allowed.includes(value as GameFlowStatus)
    ? (value as GameFlowStatus)
    : "waiting_players";
}
