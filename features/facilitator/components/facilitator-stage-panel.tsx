"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage3FacilitatorUnifiedPanel } from "@/features/stage3/components/stage3-facilitator-unified-panel";
import { Stage3FinishedScreen } from "@/features/stage3/components/stage3-finished-screen";
import { isStage3Status } from "@/features/stage3/stage3-constants";
import { Stage4FacilitatorPanel } from "@/features/stage4/components/stage4-facilitator-panel";
import { Stage4FinishedScreen } from "@/features/stage4/components/stage4-finished-screen";
import { isStage4Status } from "@/features/stage4/stage4-constants";

export function FacilitatorStagePanel() {
  const {
    status,
    stage3ActiveQuestion,
    stage3OpenedQuestionIds,
    stage3UsedQuestionIds,
    stage3OwnerTeamId,
    stage3OwnerTeamName,
    stage3SelectionTimeoutNotice,
  } = useGameFlow();

  if (!status) {
    return null;
  }

  if (isStage3Status(status)) {
    if (status === "stage3_finished") {
      return <Stage3FinishedScreen variant="facilitator" />;
    }

    if (status === "stage3_intro") {
      return null;
    }

    return (
      <Stage3FacilitatorUnifiedPanel
        status={status}
        openedQuestionIds={stage3OpenedQuestionIds}
        usedQuestionIds={stage3UsedQuestionIds}
        ownerTeamId={stage3OwnerTeamId}
        ownerTeamName={stage3OwnerTeamName}
        activeQuestion={stage3ActiveQuestion}
        selectionTimeoutNotice={stage3SelectionTimeoutNotice}
      />
    );
  }

  if (isStage4Status(status)) {
    if (status === "stage4_finished") {
      return <Stage4FinishedScreen variant="facilitator" />;
    }

    return <Stage4FacilitatorPanel />;
  }

  return null;
}
