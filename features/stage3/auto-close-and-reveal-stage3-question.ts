import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { answerRef, gameFlowRef, teamStateRef, timerRef } from "@/firebase/firestore";
import { markStage3AnswersVisibleToAudience } from "@/features/stage3/mark-stage3-answers-visible";
import {
  parseStage3QuestionMetadata,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";
import { buildStage3AnswerId } from "@/features/stage3/stage3-answer-id";
import { buildStage3AnswerPayload } from "@/features/stage3/stage3-answer-payload";
import { computeStage3PointsDelta } from "@/features/stage3/stage3-scoring";
import { buildStage3RevealTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

const MAIN_COMPETITION_ID = "main";

const SKIP_STATUSES = new Set([
  "stage3_reveal",
  "stage3_results_done",
  "stage3_board",
  "stage3_finished",
]);

export interface AutoCloseAndRevealResult {  skipped: boolean;
  questionId?: string;
}

/**
 * Idempotent: when the answering timer ends, close answers and move to reveal.
 * Safe to call from multiple clients — only the first successful transaction wins.
 */
export async function autoCloseAndRevealStage3Question(): Promise<AutoCloseAndRevealResult> {
  const result = await runTransaction(getClientFirestore(), async (transaction) => {
    const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};
    const status = gameFlow.status;
    const currentStage = gameFlow.currentStage;

    if (currentStage !== "stage3") {
      return { skipped: true as const };
    }

    if (typeof status === "string" && SKIP_STATUSES.has(status)) {
      return { skipped: true as const };
    }

    if (status !== "stage3_question_open" && status !== "stage3_answer_closed") {
      return { skipped: true as const };
    }

    const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
    const now = getSyncedNowMs();
    const answeringTimerEnded =
      timer?.stage === "stage3" &&
      timer?.purpose === "answering" &&
      typeof timer.endsAtMs === "number" &&
      timer.endsAtMs <= now;

    const closedAfterAnsweringEnded =
      status === "stage3_answer_closed" &&
      timer?.stage === "stage3" &&
      (timer?.purpose !== "answering" || timer?.active === false) &&
      typeof timer?.endsAtMs === "number" &&
      timer.endsAtMs <= now;

    if (!answeringTimerEnded && !closedAfterAnsweringEnded) {
      return { skipped: true as const };
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    const usedQuestionIds = parseStage3UsedQuestionIds(gameFlow.stage3UsedQuestionIds);
    const nextUsedIds = usedQuestionIds.includes(activeQuestion.id)
      ? usedQuestionIds
      : [...usedQuestionIds, activeQuestion.id];

    const revealSeconds = parseTimerDurations(gameFlow.durations).stage3Reveal;

    // إن لم يجب صاحب الدور قبل انتهاء الوقت، نُسجّل له «لم يُجب» مع الخصم،
    // حتى يظهر للجمهور في الإعلان (يقوم به الميسّر لأنه مخوّل).
    const ownerTeamId =
      typeof gameFlow.stage3OwnerTeamId === "string" ? gameFlow.stage3OwnerTeamId : "";
    const ownerTeamName =
      typeof gameFlow.stage3OwnerTeamName === "string"
        ? gameFlow.stage3OwnerTeamName
        : "صاحب الدور";

    if (ownerTeamId) {
      const ownerAnswerRef = answerRef(
        MAIN_COMPETITION_ID,
        buildStage3AnswerId(activeQuestion.id, ownerTeamId),
      );
      const ownerStateRef = teamStateRef(MAIN_COMPETITION_ID, ownerTeamId);
      const [ownerAnswerSnapshot, ownerStateSnapshot] = await Promise.all([
        transaction.get(ownerAnswerRef),
        transaction.get(ownerStateRef),
      ]);

      const ownerAlreadyAnswered =
        ownerAnswerSnapshot.exists() && ownerAnswerSnapshot.data().confirmed === true;

      if (!ownerAlreadyAnswered && ownerStateSnapshot.exists()) {
        const ownerState = ownerStateSnapshot.data() ?? {};
        const ownerStage3 =
          typeof ownerState.stageScores?.stage3 === "number" ? ownerState.stageScores.stage3 : 0;
        const ownerTotal =
          typeof ownerState.totalScore === "number" ? ownerState.totalScore : 0;
        const noAnswerDelta = computeStage3PointsDelta(true, activeQuestion.difficulty, "no_answer");
        const stamp = serverTimestamp();

        transaction.set(
          ownerAnswerRef,
          buildStage3AnswerPayload({
            teamId: ownerTeamId,
            teamName: ownerTeamName,
            questionId: activeQuestion.id,
            fieldId: activeQuestion.fieldId,
            difficulty: activeQuestion.difficulty,
            isOwner: true,
            answer: "",
            passed: false,
            isCorrect: false,
            pointsDelta: noAnswerDelta,
            outcome: "no_answer",
            confirmedAt: stamp,
            createdAt: stamp,
            updatedAt: stamp,
          }),
        );
        transaction.update(ownerStateRef, {
          "stageScores.stage3": ownerStage3 + noAnswerDelta,
          totalScore: ownerTotal + noAnswerDelta,
          updatedAt: serverTimestamp(),
        });
      }
    }

    transaction.update(gameFlowRef, {
      status: "stage3_reveal",
      currentStage: "stage3",
      stage3UsedQuestionIds: nextUsedIds,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage3RevealTimerPayload(now, serverTimestamp(), revealSeconds),
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

/** Official flow alias */
export const autoCloseStage3AnswersAndReveal = autoCloseAndRevealStage3Question;
