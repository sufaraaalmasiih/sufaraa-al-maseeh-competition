import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { answerRef, gameFlowRef, teamStateRef, timerRef } from "@/firebase/firestore";
import { buildStage3AnswerId } from "@/features/stage3/stage3-answer-id";
import { buildStage3AnswerPayload } from "@/features/stage3/stage3-answer-payload";
import { markStage3AnswersVisibleToAudience } from "@/features/stage3/mark-stage3-answers-visible";
import { STAGE3_SELECTION_TIMEOUT_PENALTY } from "@/features/stage3/stage3-official-constants";
import { buildStage3SelectionTimeoutQuestionMetadata } from "@/features/stage3/stage3-selection-timeout-question";
import { buildStage3RevealTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseStage3OwnerTurnIndex } from "@/features/stage3/stage3-question-metadata";
import { parseStage3TurnOrder, resolveOwnerFromTurnOrder } from "@/features/stage3/stage3-turn-order";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

const MAIN_COMPETITION_ID = "main";

export interface HandleStage3SelectionTimeoutResult {
  skipped: boolean;
  questionId?: string;
}

/**
 * Idempotent: owner failed to pick within the selection window → penalty answer,
 * reveal screen for audience (same as no-answer flow), then auto-return advances turn.
 */
export async function handleStage3SelectionTimeout(): Promise<HandleStage3SelectionTimeoutResult> {
  const result = await runTransaction(getClientFirestore(), async (transaction) => {
    const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};

    if (gameFlow.status !== "stage3_board" || gameFlow.currentStage !== "stage3") {
      return { skipped: true as const };
    }

    const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
    const now = Date.now();

    if (
      !timer ||
      timer.stage !== "stage3" ||
      timer.purpose !== "selection" ||
      typeof timer.endsAtMs !== "number" ||
      timer.endsAtMs > now
    ) {
      return { skipped: true as const };
    }

    const advanceKey = `selection_${String(timer.endsAtMs)}_${String(gameFlow.stage3OwnerTeamId ?? "")}`;

    if (gameFlow.stage3LastAutoAdvanceKey === advanceKey) {
      return { skipped: true as const };
    }

    const turnOrder = parseStage3TurnOrder(gameFlow.stage3TurnOrder);

    if (turnOrder.length === 0) {
      throw new Error("Stage 3 turn order is missing.");
    }

    const currentIndex = parseStage3OwnerTurnIndex(gameFlow.stage3OwnerTurnIndex);
    const ownerTeam = resolveOwnerFromTurnOrder(turnOrder, currentIndex);

    if (!ownerTeam) {
      throw new Error("Could not resolve current owner team.");
    }

    const activeQuestion = buildStage3SelectionTimeoutQuestionMetadata(advanceKey);
    const answerId = buildStage3AnswerId(activeQuestion.id, ownerTeam.teamId);
    const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
    const ownerStateRef = teamStateRef(MAIN_COMPETITION_ID, ownerTeam.teamId);

    const [existingAnswerSnapshot, ownerStateSnapshot] = await Promise.all([
      transaction.get(confirmedAnswerRef),
      transaction.get(ownerStateRef),
    ]);

    if (!existingAnswerSnapshot.exists() && ownerStateSnapshot.exists()) {
      const ownerState = ownerStateSnapshot.data() ?? {};
      const currentStage3Score =
        typeof ownerState.stageScores?.stage3 === "number" ? ownerState.stageScores.stage3 : 0;
      const currentTotalScore =
        typeof ownerState.totalScore === "number" ? ownerState.totalScore : 0;
      const pointsDelta = STAGE3_SELECTION_TIMEOUT_PENALTY;
      const timestamp = serverTimestamp();

      transaction.set(
        confirmedAnswerRef,
        buildStage3AnswerPayload({
          teamId: ownerTeam.teamId,
          teamName: ownerTeam.teamName,
          questionId: activeQuestion.id,
          fieldId: activeQuestion.fieldId,
          difficulty: activeQuestion.difficulty,
          isOwner: true,
          answer: "",
          passed: false,
          isCorrect: false,
          pointsDelta,
          outcome: "selection_timeout",
          confirmedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      );

      transaction.update(ownerStateRef, {
        "stageScores.stage3": currentStage3Score + pointsDelta,
        totalScore: currentTotalScore + pointsDelta,
        updatedAt: serverTimestamp(),
      });
    }

    const revealSeconds = parseTimerDurations(gameFlow.durations).stage3Reveal;
    const updatedAt = serverTimestamp();

    transaction.update(gameFlowRef, {
      status: "stage3_reveal",
      currentStage: "stage3",
      stage3ActiveQuestion: activeQuestion,
      stage3LastAutoAdvanceKey: advanceKey,
      stage3SelectionTimeoutNotice: null,
      updatedAt,
    });

    transaction.set(
      timerRef,
      buildStage3RevealTimerPayload(now, updatedAt, revealSeconds),
      { merge: true },
    );

    return { skipped: false as const, questionId: activeQuestion.id };
  });

  if (result.skipped || !result.questionId) {
    return { skipped: true };
  }

  await markStage3AnswersVisibleToAudience(result.questionId);
  return { skipped: false, questionId: result.questionId };
}
