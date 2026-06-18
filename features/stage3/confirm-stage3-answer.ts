import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import { getSyncedNowMs } from "@/lib/server-clock-sync";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import { buildStage3AnswerId } from "@/features/stage3/stage3-answer-id";
import { evaluateStage1Answer } from "@/features/stage1/stage1-answer-validation";
import { getStage3MockQuestionForScoring } from "@/features/stage3/stage3-mock-questions";
import type { ConfirmStage3AnswerResult } from "@/features/stage3/stage3-answer-types";
import { parseStage3QuestionMetadata } from "@/features/stage3/stage3-question-metadata";
import { buildStage3AnswerPayload } from "@/features/stage3/stage3-answer-payload";
import {
  computeStage3PointsDelta,
  resolveStage3AnswerOutcome,
} from "@/features/stage3/stage3-scoring";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";
const MAIN_COMPETITION_ID = "main";

interface ConfirmStage3AnswerInput {
  answer?: string;
  passed?: boolean;
  questionId?: string;
}

export async function confirmStage3Answer({
  answer = "",
  passed = false,
  questionId,
}: ConfirmStage3AnswerInput): Promise<ConfirmStage3AnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  if (passed && answer.length > 0) {
    throw new Error("Pass submissions cannot include an answer.");
  }

  return runTransaction(getClientFirestore(), async (transaction) => {
    const [
      gameFlowSnapshot,
      timerSnapshot,
    ] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    const gameFlow = gameFlowSnapshot.data();
    assertCompetitionNotFrozen(gameFlow);

    if (gameFlow?.status !== "stage3_question_open") {
      throw new Error("Stage 3 is not accepting answers.");
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    if (questionId && questionId !== activeQuestion.id) {
      throw new Error("Active question mismatch.");
    }

    const ownerTeamId =
      typeof gameFlow.stage3OwnerTeamId === "string" ? gameFlow.stage3OwnerTeamId : "";
    const isOwner = ownerTeamId.length > 0 && ownerTeamId === teamId;
    // سؤال جماعي (زائد): يُسمح للجميع بالتخطّي والنقاط مسطّحة بلا أفضلية للمالك.
    const collective = gameFlow.stage3ActiveQuestionCollective === true;

    if (passed && isOwner && !collective) {
      throw new Error("Owner team cannot pass.");
    }

    if (!timerSnapshot.exists()) {
      throw new Error("Stage 3 answer timer is missing.");
    }

    const timer = timerSnapshot.data();

    if (timer.stage !== "stage3" || timer.purpose !== "answering") {
      throw new Error("Stage 3 answer window is not active.");
    }

    assertAnsweringTimerOpen(
      timer,
      "stage3",
      "answering",
      "Stage 3 answer timer expired.",
    );

    if (timer.active !== true) {
      throw new Error("Stage 3 answer window is not active.");
    }

    const mockQuestion = getStage3MockQuestionForScoring(activeQuestion.id);

    if (!mockQuestion && !passed) {
      throw new Error("Question content not found.");
    }

    const answerId = buildStage3AnswerId(activeQuestion.id, teamId);
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
      };
    }

    if (!teamSnapshot.exists() || !teamStateSnapshot.exists()) {
      throw new Error("Missing team profile or team state.");
    }

    const teamData = teamSnapshot.data();
    const teamState = teamStateSnapshot.data();
    const currentStage3Score =
      typeof teamState.stageScores?.stage3 === "number" ? teamState.stageScores.stage3 : 0;
    const currentTotalScore =
      typeof teamState.totalScore === "number" ? teamState.totalScore : 0;

    const isCorrect = passed
      ? false
      : mockQuestion
        ? evaluateStage1Answer(mockQuestion, answer)
        : false;
    const outcome = resolveStage3AnswerOutcome(passed, isCorrect);
    const pointsDelta = computeStage3PointsDelta(
      isOwner,
      activeQuestion.difficulty,
      outcome,
      collective,
    );

    const now = serverTimestamp();

    transaction.set(
      confirmedAnswerRef,
      buildStage3AnswerPayload({
        teamId,
        teamName:
          typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
        questionId: activeQuestion.id,
        fieldId: activeQuestion.fieldId,
        difficulty: activeQuestion.difficulty,
        isOwner,
        answer,
        passed,
        isCorrect,
        pointsDelta,
        outcome,
        confirmedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    transaction.update(currentTeamStateRef, {
      "stageScores.stage3": currentStage3Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      "progress.stage3FinishedAtMs": getSyncedNowMs(),
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta, passed };
  });
}

export async function confirmStage3Pass(questionId?: string) {
  return confirmStage3Answer({ passed: true, questionId });
}
