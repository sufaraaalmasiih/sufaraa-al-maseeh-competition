import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/firebase/firebaseClient";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import { evaluateStage1Answer } from "@/features/stage1/stage1-answer-validation";
import { assertTeamStageUnlocked } from "@/features/facilitator/team-control-types";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";

const MAIN_COMPETITION_ID = "main";
const CORRECT_ANSWER_POINTS = 5;

interface ConfirmStage1AnswerInput {
  question: Stage1MockQuestion;
  questionIndex: number;
  answer: string;
}

interface ConfirmStage1AnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
}

export async function confirmStage1Answer({
  question,
  questionIndex,
  answer,
}: ConfirmStage1AnswerInput): Promise<ConfirmStage1AnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  const answerId = `stage1_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);

  return runTransaction(firestore, async (transaction) => {
    const [
      answerSnapshot,
      teamSnapshot,
      teamStateSnapshot,
      gameFlowSnapshot,
      timerSnapshot,
    ] = await Promise.all([
      transaction.get(confirmedAnswerRef),
      transaction.get(currentTeamRef),
      transaction.get(currentTeamStateRef),
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    const gameFlow = gameFlowSnapshot.data();
    assertCompetitionNotFrozen(gameFlow);

    if (gameFlow?.status !== "stage1_running") {
      throw new Error("Stage 1 is not accepting answers.");
    }

    if (timerSnapshot.exists()) {
      const timer = timerSnapshot.data();
      assertAnsweringTimerOpen(
        timer,
        "stage1",
        "answering",
        "Stage 1 timer expired.",
      );
    }

    if (answerSnapshot.exists() && answerSnapshot.data().confirmed === true) {
      const existingAnswer = answerSnapshot.data();

      return {
        duplicate: true,
        isCorrect: existingAnswer.isCorrect === true,
        pointsDelta:
          typeof existingAnswer.pointsDelta === "number"
            ? existingAnswer.pointsDelta
            : 0,
      };
    }

    if (!teamSnapshot.exists() || !teamStateSnapshot.exists()) {
      throw new Error("Missing team profile or team state.");
    }

    assertTeamStageUnlocked(teamStateSnapshot.data()?.stageLocks, "stage1");

    const teamData = teamSnapshot.data();
    const teamState = teamStateSnapshot.data();
    const currentStage1Score =
      typeof teamState.stageScores?.stage1 === "number"
        ? teamState.stageScores.stage1
        : 0;
    const currentTotalScore =
      typeof teamState.totalScore === "number" ? teamState.totalScore : 0;
    const isCorrect = evaluateStage1Answer(question, answer);
    const pointsDelta = isCorrect ? CORRECT_ANSWER_POINTS : 0;

    transaction.set(confirmedAnswerRef, {
      teamId,
      teamName:
        typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
      stage: "stage1",
      questionId: question.id,
      questionIndex,
      questionText: question.prompt,
      answer,
      confirmed: true,
      confirmedAt: serverTimestamp(),
      isCorrect,
      pointsDelta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(currentTeamStateRef, {
      "stageScores.stage1": currentStage1Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      "progress.stage1QuestionIndex": questionIndex + 1,
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta };
  });
}
