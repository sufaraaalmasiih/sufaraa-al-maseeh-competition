import { serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { prepareStage4QuestionSession } from "@/features/facilitator/prepare-stage-question-session";
import { fetchTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { buildStage4PhaseTimerPayload } from "@/features/gameflow/stage4-phase-timer";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

interface StartStage4Input {
  questionCount?: number;
}

export async function startStage4(_input: StartStage4Input = {}) {
  const indices = await prepareStage4QuestionSession();
  const [now, durations] = await Promise.all([
    resolveSyncedNowMs(true),
    fetchTimerDurations(),
  ]);

  await updateDoc(gameFlowRef, {
    status: "stage4_waiting_question",
    currentStage: "stage4",
    stage4QuestionIndex: 0,
    stage4QuestionCount: indices.length,
    stage4ActiveQuestion: null,
    stage4FinishedQuestionIds: [],
    stage4RevealStartedAt: 0,
    updatedAt: serverTimestamp(),
  });

  // مؤقت اختيار/فتح السؤال — تفتحه الأتمتة تلقائياً عند انتهائه (manual = opt-in).
  await setDoc(
    timerRef,
    buildStage4PhaseTimerPayload(now, serverTimestamp(), "selection", durations.stage4Selection),
    { merge: true },
  );
}
