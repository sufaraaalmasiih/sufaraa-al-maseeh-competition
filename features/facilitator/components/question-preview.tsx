"use client";

import { ChoiceCard } from "@/components/competition/choice-card";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import type { EditorItem } from "@/features/facilitator/question-editor-model";

/**
 * معاينة ثابتة (للقراءة فقط) تُظهر كيف يرى المتسابق السؤال — بنفس أنماط شاشة اللعب.
 * الإجابة الصحيحة مميَّزة باللون الأخضر لمساعدة المنظِّم على المراجعة.
 */
export function QuestionPreview({ item }: { item: EditorItem }) {
  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FBFE] p-4">
      <p className="mb-2 text-center text-xs font-black text-[#2388C4]">
        👁️ كما يراها المتسابق
      </p>
      <QuestionPreviewBody item={item} />
    </div>
  );
}

function CorrectChip({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }
  return (
    <p className="mt-3 rounded-xl bg-[#ECFDF5] px-3 py-2 text-center text-sm font-black text-[#047857]">
      {label}: {value}
    </p>
  );
}

function QuestionPreviewBody({ item }: { item: EditorItem }) {
  const prompt = item.question || "(بدون نص سؤال)";

  if (item.type === "matching") {
    return (
      <div>
        <QuestionPrompt size="hero">وصّل كل عبارة بما يناسبها</QuestionPrompt>
        <div className="mt-3 space-y-2">
          {item.pairs.map((pair, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-bold text-[#143A5A]">
                {pair.left || "—"}
              </span>
              <span className="text-[#2388C4]">⟵</span>
              <span className="flex-1 rounded-xl border border-[#86EFAC] bg-[#ECFDF5] px-3 py-2 text-sm font-bold text-[#047857]">
                {pair.correctRight || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "trueFalseCorrect") {
    return (
      <div>
        <QuestionPrompt reference={item.reference} imageUrl={item.imageUrl} size="hero">
          {prompt}
        </QuestionPrompt>
        <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-3">
          <ChoiceCard variant="true" selected={item.correctIsTrue}>
            <span className="text-3xl font-black">✓</span>
            صح
          </ChoiceCard>
          <ChoiceCard variant="false" selected={!item.correctIsTrue}>
            <span className="text-3xl font-black">✗</span>
            خطأ
          </ChoiceCard>
        </div>
        {!item.correctIsTrue ? <CorrectChip label="التصحيح" value={item.data} /> : null}
      </div>
    );
  }

  if (item.type === "multiple_choice") {
    return (
      <div>
        <QuestionPrompt reference={item.reference} imageUrl={item.imageUrl} size="hero">
          {prompt}
        </QuestionPrompt>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {item.options
            .filter((option) => option.trim())
            .map((option, index) => {
              const isCorrect = option.trim() === item.correct.trim();
              return (
                <div
                  key={index}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    isCorrect
                      ? "border-[#16A34A] bg-[#ECFDF5] text-[#047857]"
                      : "border-[#CBD5E1] bg-white text-[#143A5A]"
                  }`}
                >
                  {option}
                  {isCorrect ? " ✓" : ""}
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  if (item.type === "arrange" || item.type === "arrangeVerse") {
    return (
      <div>
        <QuestionPrompt reference={item.reference} imageUrl={item.imageUrl} size="hero">
          {prompt}
        </QuestionPrompt>
        <p className="mt-3 text-center text-xs font-bold text-[#475569]">الترتيب الصحيح:</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {item.parts
            .filter((part) => part.trim())
            .map((part, index) => (
              <span
                key={index}
                className="rounded-xl border border-[#86EFAC] bg-[#ECFDF5] px-3 py-1.5 text-sm font-bold text-[#047857]"
              >
                {index + 1}. {part}
              </span>
            ))}
        </div>
      </div>
    );
  }

  // missing / fill_blank / completeVerse / link / who_am_i / image
  const promptText =
    item.type === "completeVerse" && item.data ? item.data : prompt;
  const hint =
    item.type === "link"
      ? item.data
      : item.type === "who_am_i"
        ? item.data
        : "";

  return (
    <div>
      <QuestionPrompt reference={item.reference} imageUrl={item.imageUrl} size="hero">
        {promptText}
      </QuestionPrompt>
      {hint ? (
        <p className="mt-2 text-center text-sm font-bold text-[#475569]">معطيات: {hint}</p>
      ) : null}
      <div className="mx-auto mt-3 max-w-md rounded-xl border-2 border-dashed border-[#CBD5E1] bg-white px-3 py-3 text-center text-sm text-[#94A3B8]">
        خانة إجابة المتسابق
      </div>
      <CorrectChip label="الإجابة الصحيحة" value={item.correct} />
      {item.acceptedAnswers.filter((answer) => answer.trim()).length > 0 ? (
        <p className="mt-1 text-center text-xs font-semibold text-[#64748B]">
          إجابات مقبولة أيضاً: {item.acceptedAnswers.filter((answer) => answer.trim()).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
