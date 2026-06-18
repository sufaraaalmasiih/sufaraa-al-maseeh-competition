import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import {
  evaluateTrueFalseCorrectAnswer,
  serializeTrueFalseCorrectAnswer,
} from "@/features/stage2/stage2-true-false-evaluation";
import { getAuthoritativeStage2TrueFalseQuestion } from "@/features/facilitator/question-bank-runtime-cache";
import type {
  Stage2TrueFalseChoice,
  Stage2TrueFalseCorrectQuestion,
} from "@/features/stage2/stage2-true-false-correct-types";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";

const MAIN_COMPETITION_ID = "main";
const STAGE2_TRUE_FALSE_CORRECT_FIELD = "trueFalseCorrect";
const CORRECT_ANSWER_POINTS = 15;

interface ConfirmStage2TrueFalseCorrectAnswerInput {
  question: Stage2TrueFalseCorrectQuestion;
  questionIndex: number;
  selectedChoice: Stage2TrueFalseChoice;
  correctionText: string;
}

export interface ConfirmStage2TrueFalseCorrectAnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
}

export async function confirmStage2TrueFalseCorrectAnswer({
  question,
  questionIndex,
  selectedChoice,
  correctionText,
}: ConfirmStage2TrueFalseCorrectAnswerInput): Promise<ConfirmStage2TrueFalseCorrectAnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  const answerId = `stage2_trueFalseCorrect_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);
  const trimmedCorrectionText =
    selectedChoice === "false" ? correctionText.trim() : "";
  const serializedAnswer = serializeTrueFalseCorrectAnswer(
    selectedChoice,
    trimmedCorrectionText,
  );

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
      throw new Error("Stage 2 is not accepting true/false correct answers.");
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
      getAuthoritativeStage2TrueFalseQuestion(question.id) ?? question;
    const isCorrect = evaluateTrueFalseCorrectAnswer(
      scoredQuestion,
      selectedChoice,
      trimmedCorrectionText,
    );
    const pointsDelta = isCorrect ? CORRECT_ANSWER_POINTS : 0;

    transaction.set(confirmedAnswerRef, {
      teamId,
      teamName:
        typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
      stage: "stage2",
      field: STAGE2_TRUE_FALSE_CORRECT_FIELD,
      questionId: question.id,
      questionIndex,
      questionText: question.statement,
      answer: serializedAnswer,
      selectedChoice,
      correctionText: trimmedCorrectionText,
      expectedCorrection: question.expectedCorrection ?? "",
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
