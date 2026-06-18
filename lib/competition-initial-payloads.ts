import { serverTimestamp } from "firebase/firestore";
import { DEFAULT_QUESTION_DISPLAY_SETTINGS } from "@/features/facilitator/question-display-settings";

export function buildInitialGameFlowPayload() {
  return {
    status: "waiting_players",
    currentStage: "none",
    activeSessionId: null,
    currentQuestion: 0,
    competitionFrozen: false,
    stage3ActiveQuestion: null,
    stage3OpenedQuestionIds: [] as string[],
    stage3UsedQuestionIds: [] as string[],
    stage3OwnerTeamId: null,
    stage3OwnerTeamName: null,
    stage3OwnerTurnIndex: 0,
    stage3TurnOrder: [] as Array<{
      teamId: string;
      teamName: string;
      totalScoreAtStart: number;
    }>,
    stage3SelectionStartedAt: 0,
    stage3LastAutoAdvanceKey: "",
    stage3RoundId: "",
    stage3LastSelectionTimeoutKey: "",
    stage3SelectionTimeoutNotice: null,
    stage4QuestionIndex: 0,
    stage4QuestionCount: DEFAULT_QUESTION_DISPLAY_SETTINGS.stage4.displayCount,
    questionDisplaySettings: DEFAULT_QUESTION_DISPLAY_SETTINGS,
    stage1ActiveQuestionIndices: [] as number[],
    stage2ActiveQuestionIndices: [] as number[],
    stage4ActiveQuestionIndices: [] as number[],
    stage2ReadingReference: "يوحنا 15: 1-17",
    stage2ReadingPassage: "",
    stage4ActiveQuestion: null,
    stage4FinishedQuestionIds: [] as string[],
    stage4RevealStartedAt: 0,
    stage4QuestionOpenedAtMs: null,
    competitionMode: "official" as const,
    trainingEndsAtMs: null,
    updatedAt: serverTimestamp(),
  };
}

export function buildInitialTimerPayload() {
  return {
    active: false,
    remainingSeconds: 0,
    stage: "none",
    purpose: "none",
    durationSeconds: 0,
    startedAtMs: 0,
    endsAtMs: 0,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt: serverTimestamp(),
  };
}

export function buildInitialSessionPayload() {
  return {
    reauthEpoch: 0,
    updatedAt: serverTimestamp(),
  };
}

export function buildInitialAudienceDisplayPayload() {
  return {
    fullscreen: false,
    updatedAt: serverTimestamp(),
  };
}
