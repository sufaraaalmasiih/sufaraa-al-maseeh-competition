"use client";

import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { Stage1QuestionCard } from "@/features/stage1/components/stage1-question-card";
import type { Stage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { cn } from "@/lib/utils";

interface Stage3AnswerCardProps {
  question: Stage3MockQuestion;
  isOwner: boolean;
  selectedAnswer: string | null;
  answerText: string;
  confirmed: boolean;
  passed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  className?: string;
  onSelectAnswer: (answer: string) => void;
  onAnswerTextChange: (value: string) => void;
  onConfirm: (answer: string) => void;
  onPass?: () => void;
}

export function Stage3AnswerCard({
  question,
  isOwner,
  selectedAnswer,
  answerText,
  confirmed,
  passed,
  saving,
  saveError,
  disabled,
  className,
  onSelectAnswer,
  onAnswerTextChange,
  onConfirm,
  onPass,
}: Stage3AnswerCardProps) {
  const interactionLocked = confirmed || passed || saving || disabled;

  return (
    <div className={cn("stage3-answer-zone stage3-answer-zone--interactive", className)}>
      <p className="stage3-answer-zone__title">
        {isOwner ? "إجابة صاحب الدور" : "إجابتكم أو التجاوز"}
      </p>

      {disabled && !confirmed && !passed ? (
        <p className="mb-4 rounded-xl border border-white/60 bg-white/30 px-4 py-3 text-center text-sm font-bold text-[#143A5A] backdrop-blur-md">
          انتهى وقت الإجابة — بانتظار الميسّر
        </p>
      ) : null}

      {!passed ? (
        <>
          <Stage1QuestionCard
            answerText={answerText}
            arrangeShuffleSeed={`stage3-${question.id}`}
            confirmed={confirmed}
            interactionDisabled={disabled || saving}
            interactionOnly
            question={question}
            questionNumber={1}
            saveError={saveError}
            saving={saving}
            selectedAnswer={selectedAnswer}
            totalQuestions={1}
            onAnswerTextChange={onAnswerTextChange}
            onConfirm={(answer) => {
              if (answer) {
                onConfirm(answer);
              }
            }}
            onSelectAnswer={onSelectAnswer}
          />
          {!isOwner && onPass && !interactionLocked ? (
            <div className="game-ready-btn-wrap mt-4">
              <GameReadyButton
                type="button"
                className="game-ready-btn--outline"
                disabled={saving || disabled}
                onClick={onPass}
              >
                {saving ? "جاري التسجيل..." : "تجاوز"}
              </GameReadyButton>
            </div>
          ) : null}
        </>
      ) : null}

      {passed ? (
        <div className="mt-4">
          <CompetitionConfirmButton
            buttonClassName="game-ready-btn--outline"
            confirmed
            confirmedLabel="تم تسجيل التجاوز"
            onClick={() => {}}
          >
            تجاوز
          </CompetitionConfirmButton>
        </div>
      ) : null}
    </div>
  );
}
