"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";

export function Stage4AudienceQuestionScreen() {
  const { stage4ActiveQuestion, stage4QuestionIndex, stage4QuestionCount } = useGameFlow();

  return (
    <Stage4QuestionDisplay
      question={stage4ActiveQuestion}
      questionIndex={stage4QuestionIndex}
      questionCount={stage4QuestionCount}
      variant="audience"
    />
  );
}
