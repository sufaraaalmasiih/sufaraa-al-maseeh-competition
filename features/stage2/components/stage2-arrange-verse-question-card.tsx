"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
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

/** عنصر قابل للترتيب: نصّ الجزء + معرّف ثابت (يسمح بتكرار النصوص دون تعارض). */
interface ArrangeItem {
  id: string;
  text: string;
}

function buildItems(fragments: string[], shuffleSeed: string): ArrangeItem[] {
  return getStage2ArrangeDisplayFragments(fragments, shuffleSeed).map((text, index) => ({
    id: `${index}-${text}`,
    text,
  }));
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
  const initialItems = useMemo(
    () => buildItems(question.fragments, shuffleSeed),
    [question.fragments, shuffleSeed],
  );

  const [items, setItems] = useState<ArrangeItem[]>(initialItems);

  useEffect(() => {
    setItems(buildItems(question.fragments, shuffleSeed));
  }, [question.id, question.fragments, shuffleSeed]);

  const locked = confirmed || disabled || saving;

  function moveFragment(index: number, direction: "up" | "down") {
    if (locked) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function handleConfirm() {
    if (locked) return;
    onConfirm(items.map((item) => item.text));
  }

  return (
    <div className="gameplay-arrange-zone">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} imageUrl={question.imageUrl} size="hero">
          {question.prompt}
        </QuestionPrompt>
      )}

      <Reorder.Group
        as="div"
        axis="y"
        values={items}
        onReorder={(next) => {
          if (!locked) {
            setItems(next);
          }
        }}
        className="puzzle-piece-track"
      >
        {items.map((item, index) => (
          <ArrangeVersePiece
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            locked={locked}
            confirmed={confirmed}
            onMoveUp={() => moveFragment(index, "up")}
            onMoveDown={() => moveFragment(index, "down")}
          />
        ))}
      </Reorder.Group>

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

function ArrangeVersePiece({
  item,
  index,
  total,
  locked,
  confirmed,
  onMoveUp,
  onMoveDown,
}: {
  item: ArrangeItem;
  index: number;
  total: number;
  locked: boolean;
  confirmed: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={!locked}
      dragControls={dragControls}
      // touch-action: none فقط أثناء السماح بالسحب — بعد القفل يعود اللمس للتمرير.
      style={{ touchAction: locked ? undefined : "none" }}
      className={cn("puzzle-piece puzzle-piece--reorder", confirmed && "opacity-90")}
      // العنصر الممسوك يبقى مرئياً بالكامل ويرتفع قليلاً مع ظلّ — لا يصبح شفافاً.
      whileDrag={{
        scale: 1.03,
        boxShadow: "0 18px 40px rgba(35,136,196,0.28)",
        zIndex: 30,
      }}
      transition={{ type: "spring", stiffness: 600, damping: 38 }}
    >
      <span aria-hidden className="puzzle-piece-index">
        {index + 1}
      </span>
      <p className="flex flex-1 items-center justify-end text-right text-base font-black leading-7 text-[#143A5A] sm:text-lg">
        {item.text}
      </p>
      <div className="flex flex-col gap-1.5 sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 border-white/70 bg-white/50 p-0"
          disabled={locked || index === 0}
          aria-label="تحريك لأعلى"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onMoveUp}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 border-white/70 bg-white/50 p-0"
          disabled={locked || index === total - 1}
          aria-label="تحريك لأسفل"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onMoveDown}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}
