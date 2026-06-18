"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { MatchingCard, type MatchingPairTone } from "@/components/competition/matching-card";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import type { Stage2MatchingPairings } from "@/features/stage2/stage2-matching";
import {
  areAllMatchingPairsFilled,
  getShuffledMatchingRightOptions,
} from "@/features/stage2/stage2-matching";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";

interface Stage2MatchingQuestionCardProps {
  question: Stage2MatchingQuestion;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  hideQuestion?: boolean;
  onConfirm: (pairings: Stage2MatchingPairings) => void;
}

function getPairTone(pairIndex: number): MatchingPairTone {
  return Math.min(pairIndex, 4) as MatchingPairTone;
}

export function Stage2MatchingQuestionCard({
  question,
  confirmed,
  saving,
  saveError,
  disabled,
  hideQuestion = false,
  onConfirm,
}: Stage2MatchingQuestionCardProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairings, setPairings] = useState<Stage2MatchingPairings>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const shuffledRightOptions = useMemo(
    () => getShuffledMatchingRightOptions(question),
    [question],
  );

  const leftToPairIndex = useMemo(() => {
    const map = new Map<string, number>();
    question.pairs.forEach((pair, index) => {
      map.set(pair.left, index);
    });
    return map;
  }, [question.pairs]);

  const rightToLeft = useMemo(() => {
    const map = new Map<string, string>();
    for (const [left, right] of Object.entries(pairings)) {
      map.set(right, left);
    }
    return map;
  }, [pairings]);

  useEffect(() => {
    setSelectedLeft(null);
    setPairings({});
    setValidationError(null);
  }, [question.id]);

  function getLeftPairIndex(left: string): number | null {
    const index = leftToPairIndex.get(left);
    return typeof index === "number" ? index : null;
  }

  function handleLeftClick(left: string) {
    if (confirmed || disabled || saving) return;
    if (selectedLeft === left) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(left);
    setValidationError(null);
  }

  function handleRightClick(right: string) {
    if (confirmed || disabled || saving) return;

    const existingLeft = rightToLeft.get(right);
    if (existingLeft) {
      setPairings((current) => {
        const next = { ...current };
        delete next[existingLeft];
        return next;
      });
      setSelectedLeft(existingLeft);
      setValidationError(null);
      return;
    }

    if (!selectedLeft) {
      setValidationError("اختر عبارة من العمود الأول أولاً");
      return;
    }

    setPairings((current) => {
      const next = { ...current };
      for (const [left, pairedRight] of Object.entries(next)) {
        if (pairedRight === right) delete next[left];
      }
      next[selectedLeft] = right;
      return next;
    });
    setSelectedLeft(null);
    setValidationError(null);
  }

  function handleUnpair(left: string) {
    if (confirmed || disabled || saving) return;
    setPairings((current) => {
      const next = { ...current };
      delete next[left];
      return next;
    });
    setSelectedLeft(left);
  }

  function handleConfirm() {
    if (confirmed || disabled || saving) return;
    if (!areAllMatchingPairsFilled(question, pairings)) {
      setValidationError("أكمل كل التوصيلات أولاً");
      return;
    }
    setValidationError(null);
    onConfirm(pairings);
  }

  const allPaired = areAllMatchingPairsFilled(question, pairings);
  const isLocked = confirmed || disabled || saving;

  return (
    <div className="gameplay-matching-zone space-y-3">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} imageUrl={question.imageUrl} size="hero">
          {question.prompt}
        </QuestionPrompt>
      )}

      <div
        className="challenge-board matching-board-grid"
        style={{ "--matching-rows": question.pairs.length } as CSSProperties}
      >
        <div className="challenge-board-column">
          <h4 className="matching-board-column-title">العمود الأول</h4>
          {question.pairs.map((pair) => {
            const pairIndex = getLeftPairIndex(pair.left);
            const pairedRight = pairings[pair.left];
            const isSelected = selectedLeft === pair.left;
            const paired = pairIndex !== null && Boolean(pairedRight);

            return (
              <MatchingCard
                key={`${question.id}-left-${pair.left}`}
                disabled={isLocked}
                pairTone={pairIndex !== null ? getPairTone(pairIndex) : 0}
                paired={paired}
                selected={isSelected}
                className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center"
                onClick={() => {
                  if (pairedRight) handleUnpair(pair.left);
                  else handleLeftClick(pair.left);
                }}
              >
                <span className="leading-snug">{pair.left}</span>
                {pairedRight ? (
                  <span className="matching-card-pair-link inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/80 px-2 py-0.5 text-xs font-black sm:text-sm">
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    <span>{pairedRight}</span>
                  </span>
                ) : null}
              </MatchingCard>
            );
          })}
        </div>

        <div className="challenge-board-column">
          <h4 className="matching-board-column-title">العمود الثاني</h4>
          {shuffledRightOptions.map((right, index) => {
            const pairedLeft = rightToLeft.get(right);
            const pairIndex =
              pairedLeft !== undefined ? getLeftPairIndex(pairedLeft) : null;
            const paired = pairIndex !== null;

            return (
              <MatchingCard
                key={`${question.id}-right-${right}-${index}`}
                disabled={isLocked}
                pairTone={pairIndex !== null ? getPairTone(pairIndex) : 0}
                paired={paired}
                className="flex items-center justify-center text-center"
                onClick={() => handleRightClick(right)}
              >
                <span className="leading-snug">{right}</span>
              </MatchingCard>
            );
          })}
        </div>
      </div>

      {!confirmed && saveError ? (
        <p className="glass-card px-3 py-2 text-sm font-bold text-destructive">{saveError}</p>
      ) : null}
      {!confirmed && validationError ? (
        <p className="glass-card px-3 py-2 text-sm font-bold text-destructive">{validationError}</p>
      ) : null}
      <CompetitionConfirmButton
        className="mx-auto"
        confirmed={confirmed}
        disabled={disabled || saving || !allPaired}
        onClick={handleConfirm}
      >
        {saving ? "جاري الحفظ..." : "تأكيد التوصيل"}
      </CompetitionConfirmButton>
    </div>
  );
}
