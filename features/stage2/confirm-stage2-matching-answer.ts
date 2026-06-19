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
import {
  evaluateMatchingPairings,
  serializeMatchingPairings,
  type Stage2MatchingPairings,
} from "@/features/stage2/stage2-matching";
import { getAuthoritativeStage2MatchingQuestion } from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";

const MAIN_COMPETITION_ID = "main";
const STAGE2_MATCHING_FIELD = "matching";
const CORRECT_ANSWER_POINTS = 15;

interface ConfirmStage2MatchingAnswerInput {
  question: Stage2MatchingQuestion;
  questionIndex: number;
  pairings: Stage2MatchingPairings;
}

export interface ConfirmStage2MatchingAnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
}

export async function confirmStage2MatchingAnswer({
  question,
  questionIndex,
  pairings,
}: ConfirmStage2MatchingAnswerInput): Promise<ConfirmStage2MatchingAnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  const answerId = `stage2_matching_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);
  const serializedAnswer = serializeMatchingPairings(pairings);

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
      throw new Error("Stage 2 is not accepting matching answers.");
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
      getAuthoritativeStage2MatchingQuestion(question.id) ?? question;
    const isCorrect = evaluateMatchingPairings(scoredQuestion, pairings);
    const overridePoints = scoredQuestion.points;
    const correctPoints =
      typeof overridePoints === "number" && overridePoints > 0
        ? Math.min(100, Math.floor(overridePoints))
        : CORRECT_ANSWER_POINTS;
    const pointsDelta = isCorrect ? correctPoints : 0;

    transaction.set(confirmedAnswerRef, {
      teamId,
      teamName:
        typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
      stage: "stage2",
      field: STAGE2_MATCHING_FIELD,
      questionId: question.id,
      questionIndex,
      questionText: question.prompt,
      answer: serializedAnswer,
      pairings,
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
      "progress.stage2FinishedAtMs": getSyncedNowMs(),
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta };
  });
}
