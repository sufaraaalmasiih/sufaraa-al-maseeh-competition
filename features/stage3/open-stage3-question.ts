import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, teamStateRef, timerRef } from "@/firebase/firestore";
import {
  parseStage3OpenedQuestionIds,
  parseStage3OwnerTeamId,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import { buildStage3AnsweringTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseStage3TurnOrder } from "@/features/stage3/stage3-turn-order";
import { isStage3CollectiveSelection } from "@/features/stage3/stage3-scoring";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { parseQuestionDisplaySettings } from "@/features/facilitator/question-display-settings";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

const MAIN_COMPETITION_ID = "main";

interface SelectStage3QuestionByOwnerInput {
  question: Stage3QuestionMetadata;
  callerTeamId: string;
  callerTeamName: string;
}

/**
 * Owner team selects a board cell — atomic Firestore transition to question open.
 * Marks the question as used immediately so it cannot be selected twice.
 */
export async function selectStage3QuestionByOwner({
  question,
  callerTeamId,
  callerTeamName,
}: SelectStage3QuestionByOwnerInput) {
  const now = await resolveSyncedNowMs(true);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);
    const teamStateSnapshot = await transaction.get(teamStateRef(MAIN_COMPETITION_ID, callerTeamId));

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();

    if (gameFlow?.status !== "stage3_board") {
      throw new Error("Question selection is only allowed on the board.");
    }

    const ownerTeamId = parseStage3OwnerTeamId(gameFlow.stage3OwnerTeamId);

    if (!ownerTeamId) {
      throw new Error("Turn owner team is not set.");
    }

    if (ownerTeamId !== callerTeamId) {
      throw new Error("Only the turn owner team may select a question.");
    }

    const openedQuestionIds = parseStage3OpenedQuestionIds(gameFlow.stage3OpenedQuestionIds);
    const usedQuestionIds = parseStage3UsedQuestionIds(gameFlow.stage3UsedQuestionIds);

    if (usedQuestionIds.includes(question.id)) {
      throw new Error("This question has already been used.");
    }

    const nextOpenedIds = openedQuestionIds.includes(question.id)
      ? openedQuestionIds
      : [...openedQuestionIds, question.id];
    const nextUsedIds = [...usedQuestionIds, question.id];
    const answerSeconds = parseTimerDurations(gameFlow.durations).stage3Answer;

    // النقطة 15: الأسئلة الزائدة التي لا تنقسم على عدد الفرق تصبح جماعية (نقاط مسطّحة).
    const teamCount = parseStage3TurnOrder(gameFlow.stage3TurnOrder).length;
    const totalQuestions = parseQuestionDisplaySettings(gameFlow).stage3.displayCount;
    const collective = isStage3CollectiveSelection(
      usedQuestionIds.length,
      totalQuestions,
      teamCount,
    );

    transaction.update(gameFlowRef, {
      status: "stage3_question_open",
      currentStage: "stage3",
      stage3ActiveQuestion: question,
      stage3ActiveQuestionCollective: collective,
      stage3OpenedQuestionIds: nextOpenedIds,
      stage3UsedQuestionIds: nextUsedIds,
      stage3OwnerTeamId: ownerTeamId,
      stage3OwnerTeamName: callerTeamName,
      stage3SelectionTimeoutNotice: null,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage3AnsweringTimerPayload(now, serverTimestamp(), answerSeconds),
      { merge: true },
    );

    if (teamStateSnapshot.exists()) {
      transaction.update(teamStateRef(MAIN_COMPETITION_ID, callerTeamId), {
        "progress.stage3SelectedQuestionId": question.id,
        "progress.stage3.currentField": question.fieldId,
        "progress.stage3.questionIndex": question.questionNumber,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/** @deprecated Facilitator selection removed — use selectStage3QuestionByOwner from team screen. */
export async function openStage3Question(
  input: SelectStage3QuestionByOwnerInput,
): Promise<void> {
  return selectStage3QuestionByOwner(input);
}

