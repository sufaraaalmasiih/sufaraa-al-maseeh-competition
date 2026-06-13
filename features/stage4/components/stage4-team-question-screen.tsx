"use client";

import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import {
  confirmStage4Answer,
  confirmStage4Pass,
} from "@/features/stage4/confirm-stage4-answer";
import { useStage4MyAnswer } from "@/features/stage4/use-stage4-my-answer";

function formatSaveError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("not accepting answers")) {
    return "لم يعد بإمكانك الإجابة على هذا السؤال.";
  }

  return message || "تعذر حفظ الإجابة. حاول مرة أخرى.";
}

export function Stage4TeamQuestionScreen() {
  const { stage4ActiveQuestion, stage4QuestionIndex, stage4QuestionCount, status } =
    useGameFlow();
  const { answerState, loading: answerLoading } = useStage4MyAnswer(
    stage4ActiveQuestion?.id ?? null,
  );
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (answerState?.confirmed) {
      setSubmitted(true);
      setAnswerText(answerState.passed ? "" : answerState.answerText);
    } else {
      setSubmitted(false);
    }
  }, [answerState, stage4ActiveQuestion?.id]);

  if (answerLoading) {
    return <LoadingState />;
  }

  const closed = status !== "stage4_question_open";

  async function handleSubmit() {
    if (!stage4ActiveQuestion || saving || submitted || closed) {
      return;
    }

    const trimmed = answerText.trim();

    if (!trimmed) {
      setSaveError("أدخل إجابتك قبل الإرسال.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage4Answer({
        answer: trimmed,
        questionId: stage4ActiveQuestion.id,
      });

      if (!result.duplicate) {
        setSubmitted(true);
      }
    } catch (error) {
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePass() {
    if (!stage4ActiveQuestion || saving || submitted || closed) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage4Pass(stage4ActiveQuestion.id);

      if (!result.duplicate) {
        setSubmitted(true);
      }
    } catch (error) {
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Stage4QuestionDisplay
        question={stage4ActiveQuestion}
        questionIndex={stage4QuestionIndex}
        questionCount={stage4QuestionCount}
        variant="team"
      />

      {saveError ? <ErrorState title="تعذر الحفظ" description={saveError} /> : null}

      {submitted ? (
        <div className="glass-card-premium p-6 text-center">
          <p className="text-lg font-black text-[#143A5A]">
            تم استلام إجابتكم، بانتظار بقية الفرق
          </p>
        </div>
      ) : closed ? (
        <div className="glass-card-premium p-6 text-center">
          <p className="text-lg font-black text-[#143A5A]">
            تم إغلاق الإجابات، بانتظار الإعلان
          </p>
        </div>
      ) : (
        <div className="glass-card-premium space-y-4 p-6">
          <Input
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="اكتب إجابتكم هنا"
            disabled={saving}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" disabled={saving} onClick={() => void handleSubmit()}>
              {saving ? "جاري الإرسال..." : "إرسال الإجابة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void handlePass()}
            >
              تخطي / Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
