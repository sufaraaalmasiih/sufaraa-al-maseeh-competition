"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { PuzzlePiece } from "@/components/competition/puzzle-piece";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { Button } from "@/components/ui/button";
import { getStage2ArrangeDisplayFragments } from "@/features/stage2/stage2-arrange";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import { cn } from "@/lib/utils";

interface Stage2ArrangeVerseQuestionCardProps {
  question: Stage2ArrangeVerseQuestion;
  shuffleSeed: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  hideQuestion?: boolean;
  onConfirm: (orderedFragments: string[]) => void;
}

export function Stage2ArrangeVerseQuestionCard({
  question,
  shuffleSeed,
  confirmed,
  saving,
  saveError,
  disabled,
  hideQuestion = false,
  onConfirm,
}: Stage2ArrangeVerseQuestionCardProps) {
  const displayFragments = useMemo(
    () => getStage2ArrangeDisplayFragments(question.fragments, shuffleSeed),
    [question.fragments, shuffleSeed],
  );

  const [currentOrder, setCurrentOrder] = useState<string[]>(displayFragments);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setCurrentOrder(getStage2ArrangeDisplayFragments(question.fragments, shuffleSeed));
    setDraggedIndex(null);
  }, [question.id, question.fragments, shuffleSeed]);

  function moveFragment(index: number, direction: "up" | "down") {
    if (confirmed || disabled || saving) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    setCurrentOrder((items) => {
      const next = [...items];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function handleDragStart(index: number) {
    if (confirmed || disabled || saving) return;
    setDraggedIndex(index);
  }

  function handleDragOver(event: React.DragEvent, index: number) {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index || confirmed || disabled || saving) {
      return;
    }
    setCurrentOrder((items) => {
      const next = [...items];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDraggedIndex(null);
  }

  function handleConfirm() {
    if (confirmed || disabled || saving) return;
    onConfirm(currentOrder);
  }

  return (
    <div className="gameplay-arrange-zone">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} imageUrl={question.imageUrl} size="hero">
          {question.prompt}
        </QuestionPrompt>
      )}

      <div className="puzzle-piece-track" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        {currentOrder.map((fragment, index) => (
          <PuzzlePiece
            key={`${question.id}-${fragment}-${index}`}
            draggable={!confirmed && !disabled && !saving}
            dragging={draggedIndex === index}
            className={cn(confirmed && "opacity-90")}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragStart={() => handleDragStart(index)}
          >
            <span aria-hidden className="puzzle-piece-index">
              {index + 1}
            </span>
            <p className="flex flex-1 items-center justify-end text-right text-base font-black leading-7 text-[#143A5A] sm:text-lg">
              {fragment}
            </p>
            <div className="flex flex-col gap-1.5 sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-white/70 bg-white/50 p-0"
                disabled={confirmed || disabled || saving || index === 0}
                aria-label="تحريك لأعلى"
                onClick={() => moveFragment(index, "up")}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-white/70 bg-white/50 p-0"
                disabled={
                  confirmed || disabled || saving || index === currentOrder.length - 1
                }
                aria-label="تحريك لأسفل"
                onClick={() => moveFragment(index, "down")}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </PuzzlePiece>
        ))}
      </div>

      {!confirmed && saveError ? (
        <p className="glass-card px-3 py-2 text-sm font-bold text-destructive">{saveError}</p>
      ) : null}
      <CompetitionConfirmButton
        className="mx-auto"
        confirmed={confirmed}
        disabled={disabled || saving}
        onClick={handleConfirm}
      >
        {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
      </CompetitionConfirmButton>
    </div>
  );
}
