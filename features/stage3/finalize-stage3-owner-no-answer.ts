import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import { buildStage3AnswerId } from "@/features/stage3/stage3-answer-id";
import type { ConfirmStage3AnswerResult } from "@/features/stage3/stage3-answer-types";
import { parseStage3QuestionMetadata } from "@/features/stage3/stage3-question-metadata";
import { buildStage3AnswerPayload } from "@/features/stage3/stage3-answer-payload";
import { computeStage3PointsDelta } from "@/features/stage3/stage3-scoring";
const MAIN_COMPETITION_ID = "main";

export async function finalizeStage3OwnerNoAnswer(): Promise<ConfirmStage3AnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  return runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);
    const gameFlow = gameFlowSnapshot.data();

    if (gameFlow?.status !== "stage3_question_open") {
      throw new Error("Stage 3 is not accepting owner no-answer finalization.");
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    const ownerTeamId =
      typeof gameFlow.stage3OwnerTeamId === "string" ? gameFlow.stage3OwnerTeamId : "";

    if (!ownerTeamId || ownerTeamId !== teamId) {
      throw new Error("Only the owner team can finalize a no-answer penalty.");
    }

    const timerSnapshot = await transaction.get(timerRef);

    if (!timerSnapshot.exists()) {
      throw new Error("Stage 3 answer timer is missing.");
    }

    const timer = timerSnapshot.data();

    if (timer.stage !== "stage3" || timer.purpose !== "answering") {
      throw new Error("Stage 3 answer timer is not in the answering window.");
    }

    const timerExpired =
      typeof timer.endsAtMs === "number" && timer.endsAtMs <= Date.now();

    if (!timerExpired) {
      throw new Error("Stage 3 answer timer has not expired yet.");
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

    const pointsDelta = computeStage3PointsDelta(true, activeQuestion.difficulty, "no_answer");

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
        isOwner: true,
        answer: "",
        passed: false,
        isCorrect: false,
        pointsDelta,
        outcome: "no_answer",
        confirmedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    transaction.update(currentTeamStateRef, {
      "stageScores.stage3": currentStage3Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect: false, pointsDelta, passed: false };
  });
}
