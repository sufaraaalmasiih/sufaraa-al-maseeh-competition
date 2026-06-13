"use client";

import {
  STAGE3_BOARD_FIELDS,
  STAGE3_BOARD_TITLE,
  type Stage3BoardQuestion,
  type Stage3Difficulty,
} from "@/features/stage3/stage3-board-data";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { STAGE3_DIFFICULTY_LABELS } from "@/features/stage3/stage3-question-types";

export type Stage3BoardVariant = "team" | "audience" | "facilitator";

interface Stage3BoardProps {
  variant?: Stage3BoardVariant;
  /** Owner team may select a question */
  canChoose?: boolean;
  pendingQuestionId?: string | null;
  openedQuestionIds?: string[];
  usedQuestionIds?: string[];
  ownerTeamName?: string | null;
  onSelectQuestion?: (question: Stage3BoardQuestion, fieldLabel: string) => void;
}

const difficultyAccentClass: Record<Stage3Difficulty, string> = {
  easy: "stage3-q-tile--easy",
  medium: "stage3-q-tile--medium",
  hard: "stage3-q-tile--hard",
};

export function Stage3Board({
  variant = "team",
  canChoose = false,
  pendingQuestionId = null,
  openedQuestionIds = [],
  usedQuestionIds = [],
  ownerTeamName = null,
  onSelectQuestion,
}: Stage3BoardProps) {
  const isPresentation = variant === "audience";

  return (
    <div
      className={`stage3-board-shell ${isPresentation ? "stage3-board-shell--presentation" : ""}`}
    >
      <header className="stage3-board-head">
        <div className="stage3-board-head__title">
          <p className="stage3-board-head__kicker">{STAGE3_NAME}</p>
          <h2 className="stage3-board-head__name">{STAGE3_BOARD_TITLE}</h2>
        </div>
        {ownerTeamName ? (
          <div className="stage3-board-head__turn">
            <span>الدور: {ownerTeamName}</span>
          </div>
        ) : null}
      </header>

      <div className="stage3-jeopardy-board">
        {STAGE3_BOARD_FIELDS.map((field) => (
          <CategoryColumn
            key={field.key}
            label={field.label}
            questions={field.questions}
            variant={variant}
            canChoose={canChoose}
            pendingQuestionId={pendingQuestionId}
            openedQuestionIds={openedQuestionIds}
            usedQuestionIds={usedQuestionIds}
            onSelectQuestion={onSelectQuestion}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryColumn({
  label,
  questions,
  variant,
  canChoose,
  pendingQuestionId,
  openedQuestionIds,
  usedQuestionIds,
  onSelectQuestion,
}: {
  label: string;
  questions: Stage3BoardQuestion[];
  variant: Stage3BoardVariant;
  canChoose: boolean;
  pendingQuestionId: string | null;
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  onSelectQuestion?: (question: Stage3BoardQuestion, fieldLabel: string) => void;
}) {
  return (
    <article className="stage3-category-col">
      <h3 className="stage3-category-col__title">{label}</h3>
      <div className="stage3-category-col__tiles">
        {questions.map((question) => (
          <QuestionTile
            key={question.id}
            question={question}
            fieldLabel={label}
            variant={variant}
            canChoose={canChoose}
            isPending={pendingQuestionId === question.id}
            isOpened={openedQuestionIds.includes(question.id)}
            isUsed={usedQuestionIds.includes(question.id)}
            onSelectQuestion={onSelectQuestion}
          />
        ))}
      </div>
    </article>
  );
}

function QuestionTile({
  question,
  fieldLabel,
  variant,
  canChoose,
  isPending,
  isOpened,
  isUsed,
  onSelectQuestion,
}: {
  question: Stage3BoardQuestion;
  fieldLabel: string;
  variant: Stage3BoardVariant;
  canChoose: boolean;
  isPending: boolean;
  isOpened: boolean;
  isUsed: boolean;
  onSelectQuestion?: (question: Stage3BoardQuestion, fieldLabel: string) => void;
}) {
  const isChooseable = canChoose && !isUsed;
  const isLocked = variant === "team" && !canChoose && !isUsed;

  const className = [
    "stage3-q-tile",
    difficultyAccentClass[question.difficulty],
    isChooseable ? "stage3-q-tile--chooseable" : "",
    isLocked ? "stage3-q-tile--locked" : "",
    isUsed ? "stage3-q-tile--used" : "",
    isPending ? "stage3-q-tile--pending" : "",
    isOpened && !isUsed ? "stage3-q-tile--opened" : "",
    variant === "audience" || variant === "facilitator" ? "stage3-q-tile--readonly" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label = `${question.number} · ${STAGE3_DIFFICULTY_LABELS[question.difficulty]}`;
  const pointsLabel = `+${question.scorePreview.ownerPoints}`;

  const content = isUsed ? (
    <>
      <span className="stage3-q-tile__label stage3-q-tile__label--used">{label}</span>
      <span className="stage3-q-tile__used-tag">مُستخدم</span>
    </>
  ) : (
    <>
      <span className="stage3-q-tile__label">{label}</span>
      <span className="stage3-q-tile__pts">{pointsLabel}</span>
    </>
  );

  if (variant === "team") {
    return (
      <button
        type="button"
        className={className}
        aria-label={isUsed ? `${label} — مُستخدم` : `${label} — ${pointsLabel}`}
        aria-pressed={isPending}
        disabled={!isChooseable || isPending}
        onClick={() => {
          if (!isChooseable) {
            return;
          }
          onSelectQuestion?.(question, fieldLabel);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} aria-label={isUsed ? `${label} — مُستخدم` : `${label} — ${pointsLabel}`}>
      {content}
    </div>
  );
}
