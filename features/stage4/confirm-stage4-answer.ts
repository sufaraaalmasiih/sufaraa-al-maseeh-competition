import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import { getSyncedNowMs } from "@/lib/server-clock-sync";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
} from "@/firebase/firestore";
import { buildStage4AnswerId } from "@/features/stage4/stage4-answer-id";
import { buildStage4AnswerPayload } from "@/features/stage4/stage4-answer-payload";
import type { ConfirmStage4AnswerResult } from "@/features/stage4/stage4-answer-types";
import { validateStage4Answer } from "@/features/stage4/stage4-answer-validation";
import { getAuthoritativeStage4Question } from "@/features/facilitator/question-bank-runtime-cache";
import { getStage4MockQuestion } from "@/features/stage4/stage4-mock-questions";
import { parseStage4QuestionMetadata } from "@/features/stage4/stage4-question-metadata";
import { assertTeamStageUnlocked } from "@/features/facilitator/team-control-types";
import {
  computeStage4NextCorrectPoints,
  computeStage4PointsForCorrect,
  resolveStage4StreakAfterAnswer,
} from "@/features/stage4/stage4-scoring";
import { assertCompetitionNotFrozen } from "@/lib/competition-guards";

const MAIN_COMPETITION_ID = "main";

interface ConfirmStage4AnswerInput {
  answer?: string;
  passed?: boolean;
  questionId?: string;
}

function readStage4Streak(teamState: Record<string, unknown>): number {
  const stage4 = teamState.stage4;

  if (stage4 && typeof stage4 === "object" && typeof (stage4 as { streak?: unknown }).streak === "number") {
    return (stage4 as { streak: number }).streak;
  }

  const progress = teamState.progress;

  if (
    progress &&
    typeof progress === "object" &&
    typeof (progress as { stage4Streak?: unknown }).stage4Streak === "number"
  ) {
    return (progress as { stage4Streak: number }).stage4Streak;
  }

  return 0;
}

export async function confirmStage4Answer({
  answer = "",
  passed = false,
  questionId,
}: ConfirmStage4AnswerInput): Promise<ConfirmStage4AnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  if (passed && answer.length > 0) {
    throw new Error("Pass submissions cannot include an answer.");
  }

  return runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    assertCompetitionNotFrozen(gameFlow);

    if (gameFlow?.status !== "stage4_question_open") {
      throw new Error("Stage 4 is not accepting answers.");
    }

    const activeQuestion = parseStage4QuestionMetadata(gameFlow.stage4ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    if (questionId && questionId !== activeQuestion.id) {
      throw new Error("Active question mismatch.");
    }

    const answerId = buildStage4AnswerId(activeQuestion.id, teamId);
    const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
    const currentTeamRef = teamRef(teamId);
    const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);

    const [answerSnapshot, teamSnapshot, teamStateSnapshot] = await Promise.all([
      transaction.get(confirmedAnswerRef),
      transaction.get(currentTeamRef),
      transaction.get(currentTeamStateRef),
    ]);

    if (answerSnapshot.exists() && answerSnapshot.data().confirmed === true) {
      const existingAnswer = answerSnapshot.data();

      return {
        duplicate: true,
        isCorrect: existingAnswer.isCorrect === true,
        pointsDelta:
          typeof existingAnswer.pointsDelta === "number" ? existingAnswer.pointsDelta : 0,
        passed: existingAnswer.passed === true,
        streakAfter:
          typeof existingAnswer.streakAfter === "number" ? existingAnswer.streakAfter : 0,
      };
    }

    if (!teamSnapshot.exists() || !teamStateSnapshot.exists()) {
      throw new Error("Missing team profile or team state.");
    }

    assertTeamStageUnlocked(teamStateSnapshot.data()?.stageLocks, "stage4");

    const teamData = teamSnapshot.data();
    const teamState = teamStateSnapshot.data() as Record<string, unknown>;
    const currentStage4Score =
      teamState.stageScores &&
      typeof teamState.stageScores === "object" &&
      typeof (teamState.stageScores as { stage4?: unknown }).stage4 === "number"
        ? (teamState.stageScores as { stage4: number }).stage4
        : 0;
    const currentTotalScore =
      typeof teamState.totalScore === "number" ? teamState.totalScore : 0;
    const streakBefore = readStage4Streak(teamState);

    const mockQuestion =
      getAuthoritativeStage4Question(activeQuestion.id) ??
      getStage4MockQuestion(activeQuestion.id);
    const isCorrect = passed
      ? false
      : validateStage4Answer(mockQuestion ?? activeQuestion, answer);
    const streakAfter = resolveStage4StreakAfterAnswer(streakBefore, isCorrect, passed);
    // تجاوز نقاط لكل سؤال إن حُدِّد (بدل تصاعد السلسلة) — مع احترام سقف كتابة الفريق (≤25).
    const overridePoints =
      mockQuestion && typeof (mockQuestion as { points?: unknown }).points === "number"
        ? Math.min(25, Math.floor((mockQuestion as { points: number }).points))
        : 0;
    const pointsDelta = isCorrect
      ? overridePoints > 0
        ? overridePoints
        : computeStage4PointsForCorrect(streakAfter)
      : 0;
    const nextCorrectPoints = computeStage4NextCorrectPoints(streakAfter);
    const now = serverTimestamp();
    const answeredQuestionIds = Array.isArray(
      (teamState.progress as { stage4AnsweredQuestionIds?: unknown } | undefined)
        ?.stage4AnsweredQuestionIds,
    )
      ? [
          ...((teamState.progress as { stage4AnsweredQuestionIds: string[] })
            .stage4AnsweredQuestionIds),
        ]
      : [];

    const nextAnsweredIds = answeredQuestionIds.includes(activeQuestion.id)
      ? answeredQuestionIds
      : [...answeredQuestionIds, activeQuestion.id];

    transaction.set(
      confirmedAnswerRef,
      buildStage4AnswerPayload({
        teamId,
        teamName:
          typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
        questionId: activeQuestion.id,
        answerText: passed ? "" : answer,
        passed,
        isCorrect,
        pointsDelta,
        streakBefore,
        streakAfter,
        answeredAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );

    transaction.update(currentTeamStateRef, {
      "stageScores.stage4": currentStage4Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      "stage4.streak": streakAfter,
      "stage4.nextCorrectPoints": nextCorrectPoints,
      "progress.stage4Streak": streakAfter,
      "progress.stage4AnsweredQuestionIds": nextAnsweredIds,
      "progress.stage4FinishedAtMs": getSyncedNowMs(),
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta, passed, streakAfter };
  });
}

export async function confirmStage4Pass(questionId?: string) {
  return confirmStage4Answer({ passed: true, questionId });
}
