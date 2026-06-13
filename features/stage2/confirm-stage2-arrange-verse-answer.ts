import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/firebase/firebaseClient";
import {
  answerRef,
  gameFlowRef,
  teamRef,
  teamStateRef,
  timerRef,
} from "@/firebase/firestore";
import { isStage2ArrangeOrderCorrect } from "@/features/stage2/stage2-arrange";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";

const MAIN_COMPETITION_ID = "main";
const STAGE2_ARRANGE_VERSE_FIELD = "arrangeVerse";
const CORRECT_ANSWER_POINTS = 15;
const ANSWER_SEPARATOR = " | ";

export function serializeArrangeVerseAnswer(orderedFragments: string[]): string {
  return orderedFragments.join(ANSWER_SEPARATOR);
}

export function isArrangeVerseOrderCorrect(
  orderedFragments: string[],
  correctOrder: string[],
): boolean {
  return isStage2ArrangeOrderCorrect(orderedFragments, correctOrder);
}

interface ConfirmStage2ArrangeVerseAnswerInput {
  question: Stage2ArrangeVerseQuestion;
  questionIndex: number;
  orderedFragments: string[];
}

export interface ConfirmStage2ArrangeVerseAnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
}

export async function confirmStage2ArrangeVerseAnswer({
  question,
  questionIndex,
  orderedFragments,
}: ConfirmStage2ArrangeVerseAnswerInput): Promise<ConfirmStage2ArrangeVerseAnswerResult> {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  const answerId = `stage2_arrangeVerse_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);
  const serializedAnswer = serializeArrangeVerseAnswer(orderedFragments);

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
    if (gameFlow?.status !== "stage2_player_turns") {
      throw new Error("Stage 2 is not accepting arrange verse answers.");
    }

    if (timerSnapshot.exists()) {
      const timer = timerSnapshot.data();
      const timerExpired =
        timer.active === true &&
        timer.stage === "stage2" &&
        timer.purpose === "answering" &&
        typeof timer.endsAtMs === "number" &&
        timer.endsAtMs <= Date.now();

      if (timerExpired) {
        throw new Error("Stage 2 answering timer expired.");
      }
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
    const isCorrect = isArrangeVerseOrderCorrect(
      orderedFragments,
      question.correctOrder,
    );
    const pointsDelta = isCorrect ? CORRECT_ANSWER_POINTS : 0;

    transaction.set(confirmedAnswerRef, {
      teamId,
      teamName:
        typeof teamData.teamName === "string" ? teamData.teamName : "فريق بدون اسم",
      stage: "stage2",
      field: STAGE2_ARRANGE_VERSE_FIELD,
      questionId: question.id,
      questionIndex,
      questionText: question.prompt,
      answer: serializedAnswer,
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
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta };
  });
}
