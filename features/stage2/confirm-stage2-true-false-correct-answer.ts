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
import { serializeTrueFalseCorrectAnswer } from "@/features/stage2/stage2-true-false-evaluation";
import { getAuthoritativeStage2TrueFalseQuestion } from "@/features/facilitator/question-bank-runtime-cache";
import { normalizeStage1AnswerText } from "@/features/stage1/stage1-answer-validation";
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
  selectedWrongPart: string;
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
  selectedWrongPart,
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
  const trimmedWrongPart = selectedChoice === "false" ? selectedWrongPart.trim() : "";
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

    // تحكيم تلقائي للنقاط الجزئية (بدل التحكيم اليدوي):
    // - عبارة صحيحة + «صح» ⇒ +15.
    // - عبارة خاطئة + «خطأ» ⇒ 5+5+5 آلياً: تأكيد الخطأ + تطابق الجزء الخاطئ + تطابق التصحيح.
    // - غير ذلك ⇒ 0. (المقارنة بتطبيع عربي يتجاهل التشكيل وأل التعريف والفواصل.)
    const statementIsTrue = scoredQuestion.correctIsTrue;
    const trueCorrect = statementIsTrue && selectedChoice === "true";

    let facilitatorMarkedWrong = false;
    let wrongPartIdentified = false;
    let correctionApproved = false;
    let pointsDelta = 0;

    if (trueCorrect) {
      pointsDelta = CORRECT_ANSWER_POINTS; // 15
    } else if (!statementIsTrue && selectedChoice === "false") {
      facilitatorMarkedWrong = true; // عرف أنها عبارة خاطئة

      const expectedWrong = scoredQuestion.expectedWrongPart ?? "";
      if (expectedWrong) {
        wrongPartIdentified =
          trimmedWrongPart.length > 0 &&
          normalizeStage1AnswerText(trimmedWrongPart) === normalizeStage1AnswerText(expectedWrong);
      } else {
        // لا «جزء متوقّع» في السؤال: نقبل إن أشار المتسابق إلى جزء فعلي من الجملة.
        wrongPartIdentified =
          trimmedWrongPart.length > 0 &&
          normalizeStage1AnswerText(scoredQuestion.statement).includes(
            normalizeStage1AnswerText(trimmedWrongPart),
          );
      }

      const expectedCorr = scoredQuestion.expectedCorrection ?? "";
      correctionApproved =
        expectedCorr.length > 0 &&
        trimmedCorrectionText.length > 0 &&
        normalizeStage1AnswerText(trimmedCorrectionText) === normalizeStage1AnswerText(expectedCorr);

      pointsDelta =
        (facilitatorMarkedWrong ? 5 : 0) +
        (wrongPartIdentified ? 5 : 0) +
        (correctionApproved ? 5 : 0);
    }

    const isCorrect = pointsDelta >= CORRECT_ANSWER_POINTS;

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
      selectedWrongPart: trimmedWrongPart,
      correctionText: trimmedCorrectionText,
      expectedCorrection: question.expectedCorrection ?? "",
      statementIsTrue,
      confirmed: true,
      confirmedAt: serverTimestamp(),
      isCorrect,
      pointsDelta,
      // التحكيم تلقائي ومكتمل — لا يحتاج الميسّر.
      needsGrading: false,
      gradingComplete: true,
      facilitatorMarkedWrong,
      wrongPartIdentified,
      correctionApproved,
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
