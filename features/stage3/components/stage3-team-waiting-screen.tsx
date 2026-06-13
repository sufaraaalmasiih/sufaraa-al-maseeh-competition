"use client";

import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

type Stage3TeamWaitingVariant = "answer_closed" | "reveal" | "results_done";

interface Stage3TeamWaitingScreenProps {
  variant: Stage3TeamWaitingVariant;
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

const WAITING_COPY: Record<
  Stage3TeamWaitingVariant,
  { title: string; subtitle: string }
> = {
  answer_closed: {
    title: "تم إغلاق الإجابات",
    subtitle: "انتظروا إظهار النتائج على شاشة الجمهور.",
  },
  reveal: {
    title: "تُعرض الإجابات الآن",
    subtitle: "يتم الآن عرض النتائج على شاشة الجمهور.",
  },
  results_done: {
    title: "انتهى عرض الإجابات",
    subtitle: "بانتظار الدور التالي من الميسّر.",
  },
};

export function Stage3TeamWaitingScreen({
  variant,
  question,
  ownerTeamName,
}: Stage3TeamWaitingScreenProps) {
  const copy = WAITING_COPY[variant];

  return (
    <div className="stage3-scene">
      <Stage3QuestionOpenScreen
        question={question}
        ownerTeamName={ownerTeamName}
        variant="team"
      />
      <div className="stage3-turn-banner stage3-turn-banner--wait">
        <p className="stage3-turn-banner__kicker">على المحك</p>
        <p className="stage3-turn-banner__title">{copy.title}</p>
        <p className="stage3-turn-banner__subtitle">{copy.subtitle}</p>
      </div>
    </div>
  );
}

