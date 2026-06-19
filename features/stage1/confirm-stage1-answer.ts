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
import { evaluateStage1Answer } from "@/features/stage1/stage1-answer-validation";
import { getAuthoritativeStage1Question } from "@/features/facilitator/stage1-question-bank-store";
import { assertTeamStageUnlocked } from "@/features/facilitator/team-control-types";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
} from "@/lib/competition-guards";
import { ensureTeamProfileDoc } from "@/lib/ensure-team-profile";
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
  const user = firebaseAuth.currentUser;
  const teamId = user?.uid;

  if (!teamId || !user) {
    throw new Error("Missing authenticated team.");
  }

  await user.getIdToken(true);
  await ensureTeamProfileDoc(teamId);

  const answerId = `stage1_${question.id}_${teamId}`;
  const confirmedAnswerRef = answerRef(MAIN_COMPETITION_ID, answerId);
  const currentTeamRef = teamRef(teamId);
  const currentTeamStateRef = teamStateRef(MAIN_COMPETITION_ID, teamId);

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

    if (gameFlow?.status !== "stage1_running") {
      throw new Error("المرحلة الأولى لا تقبل إجابات الآن.");
    }

    if (timerSnapshot.exists()) {
      const timer = timerSnapshot.data();
      assertAnsweringTimerOpen(
        timer,
        "stage1",
        "answering",
        "انتهى وقت الإجابة.",
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

    if (!teamStateSnapshot.exists()) {
      throw new Error("بيانات الفريق غير مكتملة. أعد تسجيل الدخول أو تواصل مع الميسر.");
    }

    assertTeamStageUnlocked(teamStateSnapshot.data()?.stageLocks, "stage1");

    const teamState = teamStateSnapshot.data();
    const teamData = teamSnapshot.exists()
      ? teamSnapshot.data()
      : {
          teamName:
            typeof teamState.teamName === "string" ? teamState.teamName : "فريق بدون اسم",
          governorate:
            typeof teamState.governorate === "string" ? teamState.governorate : "",
        };

    const currentStage1Score =
      typeof teamState.stageScores?.stage1 === "number"
        ? teamState.stageScores.stage1
        : 0;
    const currentTotalScore =
      typeof teamState.totalScore === "number" ? teamState.totalScore : 0;
    const scoredQuestion =
      getAuthoritativeStage1Question(question.id) ?? question;
    const isCorrect = evaluateStage1Answer(scoredQuestion, answer);
    // تجاوز نقاط لكل سؤال إن حُدِّد — مع احترام سقف كتابة الفريق لنفسه (≤25) في قواعد الأمان.
    const overridePoints = scoredQuestion.points;
    const correctPoints =
      typeof overridePoints === "number" && overridePoints > 0
        ? Math.min(25, Math.floor(overridePoints))
        : CORRECT_ANSWER_POINTS;
    const pointsDelta: number = isCorrect ? correctPoints : 0;

    const answerPayload = {
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
      updatedAt: serverTimestamp(),
    };

    if (answerSnapshot.exists()) {
      transaction.update(confirmedAnswerRef, answerPayload);
    } else {
      transaction.set(confirmedAnswerRef, {
        ...answerPayload,
        createdAt: serverTimestamp(),
      });
    }

    transaction.update(currentTeamStateRef, {
      "stageScores.stage1": currentStage1Score + pointsDelta,
      totalScore: currentTotalScore + pointsDelta,
      "progress.stage1QuestionIndex": questionIndex + 1,
      "progress.stage1FinishedAtMs": getSyncedNowMs(),
      updatedAt: serverTimestamp(),
    });

    return { duplicate: false, isCorrect, pointsDelta };
  });
}
