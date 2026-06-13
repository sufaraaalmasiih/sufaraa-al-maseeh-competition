"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
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
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import type { GameFlow, GameFlowStatus } from "@/types";

const LISTENER_PATH = "competitions/main/system/gameFlow";

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
  loading: boolean;
  error: string | null;
}

export function useGameFlow(): UseGameFlowResult {
  const [gameFlow, setGameFlow] = useState<GameFlow | null>(null);
  const [stage3ActiveQuestion, setStage3ActiveQuestion] =
    useState<Stage3QuestionMetadata | null>(null);
  const [stage3OpenedQuestionIds, setStage3OpenedQuestionIds] = useState<string[]>([]);
  const [stage3UsedQuestionIds, setStage3UsedQuestionIds] = useState<string[]>([]);
  const [stage3OwnerTeamId, setStage3OwnerTeamId] = useState<string | null>(null);
  const [stage3OwnerTeamName, setStage3OwnerTeamName] = useState<string | null>(null);
  const [stage3SelectionTimeoutNotice, setStage3SelectionTimeoutNotice] =
    useState<Stage3SelectionTimeoutNotice | null>(null);
  const [stage4ActiveQuestion, setStage4ActiveQuestion] =
    useState<Stage4QuestionMetadata | null>(null);
  const [stage4QuestionIndex, setStage4QuestionIndex] = useState(0);
  const [stage4QuestionCount, setStage4QuestionCount] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    realLoadingDebug("useGameFlow", "subscribing listener", { listenerPath: LISTENER_PATH });
    patchLoadingDebug({ gameFlowLoading: true });

    return onSnapshot(
      gameFlowRef,
      (snapshot) => {
        realLoadingDebug("useGameFlow", "snapshot received", {
          listenerPath: LISTENER_PATH,
          snapshotReceived: true,
          exists: snapshot.exists(),
        });

        if (!snapshot.exists()) {
          setGameFlow(null);
          setStage3ActiveQuestion(null);
          setStage3OpenedQuestionIds([]);
          setStage3UsedQuestionIds([]);
          setStage3OwnerTeamId(null);
          setStage3OwnerTeamName(null);
          setStage3SelectionTimeoutNotice(null);
          setStage4ActiveQuestion(null);
          setStage4QuestionIndex(0);
          setStage4QuestionCount(15);
          setError("لم يتم العثور على إعدادات سير المسابقة.");
          setLoading(false);
          patchLoadingDebug({ gameFlowLoading: false, gameFlowStatus: null });
          realLoadingDebug("useGameFlow", "loading false reached (missing doc)", {
            data: null,
          });
          return;
        }

        const data = snapshot.data();
        const status = normalizeStatus(data.status);
        realLoadingDebug("useGameFlow", "snapshot data", {
          listenerPath: LISTENER_PATH,
          data: {
            status,
            currentStage: data.currentStage,
            currentQuestion: data.currentQuestion,
          },
        });

        setGameFlow({
          status,
          currentStage:
            typeof data.currentStage === "string" ? data.currentStage : "none",
          currentQuestion:
            typeof data.currentQuestion === "number" ? data.currentQuestion : 0,
        });
        setStage3ActiveQuestion(parseStage3QuestionMetadata(data.stage3ActiveQuestion));
        setStage3OpenedQuestionIds(parseStage3OpenedQuestionIds(data.stage3OpenedQuestionIds));
        setStage3UsedQuestionIds(parseStage3UsedQuestionIds(data.stage3UsedQuestionIds));
        setStage3OwnerTeamId(parseStage3OwnerTeamId(data.stage3OwnerTeamId));
        setStage3OwnerTeamName(parseStage3OwnerTeamName(data.stage3OwnerTeamName));
        setStage3SelectionTimeoutNotice(
          parseStage3SelectionTimeoutNotice(data.stage3SelectionTimeoutNotice),
        );
        setStage4ActiveQuestion(parseStage4QuestionMetadata(data.stage4ActiveQuestion));
        setStage4QuestionIndex(
          typeof data.stage4QuestionIndex === "number" ? data.stage4QuestionIndex : 0,
        );
        setStage4QuestionCount(
          typeof data.stage4QuestionCount === "number" ? data.stage4QuestionCount : 15,
        );
        setError(null);
        setLoading(false);
        patchLoadingDebug({ gameFlowLoading: false, gameFlowStatus: status });
        realLoadingDebug("useGameFlow", "loading false reached", {
          status,
          currentStage:
            typeof data.currentStage === "string" ? data.currentStage : "none",
        });
      },
      (listenerError) => {
        setError("تعذر الاتصال بسير المسابقة في الوقت الحالي.");
        setLoading(false);
        patchLoadingDebug({ gameFlowLoading: false });
        realLoadingDebug("useGameFlow", "loading false reached (listener error)", {
          listenerPath: LISTENER_PATH,
          snapshotReceived: false,
          error: listenerError instanceof Error ? listenerError.message : String(listenerError),
        });
      },
    );
  }, []);

  return {
    gameFlow,
    status: gameFlow?.status ?? null,
    currentStage: gameFlow?.currentStage ?? null,
    currentQuestion: gameFlow?.currentQuestion ?? null,
    stage3ActiveQuestion,
    stage3OpenedQuestionIds,
    stage3UsedQuestionIds,
    stage3OwnerTeamId,
    stage3OwnerTeamName,
    stage3SelectionTimeoutNotice,
    stage4ActiveQuestion,
    stage4QuestionIndex,
    stage4QuestionCount,
    loading,
    error,
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
