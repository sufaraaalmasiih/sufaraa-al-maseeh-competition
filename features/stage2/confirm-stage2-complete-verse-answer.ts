import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import { stage2AnswersMatch } from "@/features/stage2/stage2-answer-validation";
import { getAuthoritativeStage2CompleteVerseQuestion } from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";

const MAIN_COMPETITION_ID = "main";
const STAGE2_COMPLETE_VERSE_FIELD = "completeVerse";
const CORRECT_ANSWER_POINTS = 15;

interface ConfirmStage2CompleteVerseAnswerInput {
  question: Stage2CompleteVerseQuestion;
  questionIndex: number;
  answer: string;
}

export interface ConfirmStage2CompleteVerseAnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
}

export async function confirmStage2CompleteVerseAnswer({
  question,
  questionIndex,
  answer,
}: ConfirmStage2CompleteVerseAnswerInput): Promise<ConfirmStage2CompleteVerseAnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  const answerId = `stage2_completeVerse_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);
  const trimmedAnswer = answer.trim();

  return runTransaction(getClientFirestore(), async (transaction) => {
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

    if (gameFlow?.status !== "stage2_player_turns") {
      throw new Error("Stage 2 is not accepting complete verse answers.");
    }

    if (timerSnapshot.exists()) {
      const timer = timerSnapshot.data();
      assertAnsweringTimerOpen(
        timer,
        "stage2",
        "answering",
        "Stage 2 answering timer expired.",
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

    const teamData = teamSnapshot.data();
    const teamState = teamStateSnapshot.data();
    const currentStage2Score =
      typeof teamState.stageScores?.stage2 === "number"
        ? teamState.stageScores.stage2
        : 0;
    const currentTotalScore =
      typeof teamState.totalScore === "number" ? teamState.totalScore : 0;
    const scoredQuestion =
      getAuthoritativeStage2CompleteVerseQuestion(question.id) ?? question;
    const isCorrect = stage2AnswersMatch(trimmedAnswer, scoredQuestion.correctAnswer);
    const pointsDelta = isCorrect ? CORRECT_ANSWER_POINTS : 0;

    transaction.set(confirmedAnswerRef, {
      teamId,
      teamName:
        typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
      stage: "stage2",
      field: STAGE2_COMPLETE_VERSE_FIELD,
      questionId: question.id,
      questionIndex,
      questionText: question.prompt,
      answer: trimmedAnswer,
      confirmed: true,
      confirmedAt: serverTimestamp(),
      isCorrect,
      pointsDelta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(currentTeamStateRef, {
      "stageScores.stage2": currentStage2Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      "progress.stage2QuestionIndex": questionIndex + 1,
      "progress.stage2FinishedAtMs": Date.now(),
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta };
  });
}
