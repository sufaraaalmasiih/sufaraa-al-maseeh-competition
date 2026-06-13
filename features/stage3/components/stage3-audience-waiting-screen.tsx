"use client";

import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

type Stage3AudienceWaitingVariant = "answer_closed" | "reveal" | "results_done";

interface Stage3AudienceWaitingScreenProps {
  variant: Stage3AudienceWaitingVariant;
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

const COPY: Record<Stage3AudienceWaitingVariant, { title: string; subtitle: string }> = {
  answer_closed: {
    title: "تم إغلاق الإجابات",
    subtitle: "بانتظار إظهار النتائج.",
  },
  reveal: {
    title: "الإعلان جارٍ",
    subtitle: "يتم عرض النتائج الآن.",
  },
  results_done: {
    title: "انتهى الإعلان",
    subtitle: "بانتظار الدور التالي.",
  },
};

export function Stage3AudienceWaitingScreen({
  variant,
  question,
  ownerTeamName,
}: Stage3AudienceWaitingScreenProps) {
  const copy = COPY[variant];

  return (
    <div className="stage3-scene">
      <Stage3QuestionOpenScreen
        question={question}
        ownerTeamName={ownerTeamName}
        variant="audience"
      />
      <div className="stage3-turn-banner stage3-turn-banner--wait">
        <p className="stage3-turn-banner__kicker">على المحك</p>
        <p className="stage3-turn-banner__title">{copy.title}</p>
        <p className="stage3-turn-banner__subtitle">{copy.subtitle}</p>
      </div>
    </div>
  );
}

