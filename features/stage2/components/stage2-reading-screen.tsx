"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2ReadingPanel } from "@/features/stage2/components/stage2-reading-panel";
import { Stage2FieldWaitingScreen } from "@/features/stage2/components/stage2-field-waiting-screen";

export function Stage2ReadingScreen() {
  const { timer, isExpired } = useCompetitionTimer();
  const { stage2ReadingReference, stage2ReadingPassage } = useGameFlow();
  const hasReadingTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "reading",
  );
  const readingJustEnded = Boolean(
    timer?.stage === "stage2" && timer?.purpose === "reading" && isExpired,
  );

  // انتهت القراءة → شاشة انتظار (الساعة الرملية) حتى يبدأ الميسّر أسئلة المجالات.
  if (readingJustEnded) {
    return (
      <Stage2FieldWaitingScreen
        badge="انتهت القراءة"
        title="أحسنتم القراءة"
        subtitle="بانتظار بدء أسئلة المجالات من الميسّر"
      />
    );
  }

  return (
    <Stage2ReadingPanel
      reference={stage2ReadingReference}
      passage={stage2ReadingPassage}
      hasReadingTimer={hasReadingTimer}
      showFinishedNotice={false}
    />
  );
}
