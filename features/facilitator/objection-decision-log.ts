import { appendActiveSessionEditLog } from "@/features/facilitator/competition-session";
import { getFacilitatorActorName } from "@/features/facilitator/facilitator-actor";
import {
  objectionDecisionScopeLabel,
  type ObjectionDecisionScope,
} from "@/features/competition/objection-accepted-notice";

export async function logObjectionDecision(input: {
  objectionId: string;
  decision: "accepted" | "rejected";
  teamId: string;
  teamName: string;
  questionLabel: string;
  scope?: ObjectionDecisionScope;
}): Promise<void> {
  const facilitatorName = getFacilitatorActorName();
  const scopeLabel =
    input.decision === "accepted" && input.scope
      ? objectionDecisionScopeLabel(input.scope)
      : null;

  await appendActiveSessionEditLog({
    action: input.decision === "accepted" ? "objection_accepted" : "objection_rejected",
    reason:
      input.decision === "accepted"
        ? `قبول اعتراض${scopeLabel ? ` (${scopeLabel})` : ""} — ${input.questionLabel}`
        : `رفض اعتراض — ${input.questionLabel}`,
    teamId: input.teamId,
    teamName: input.teamName,
    details: {
      objectionId: input.objectionId,
      questionLabel: input.questionLabel,
      decision: input.decision,
      scope: input.scope ?? null,
      facilitatorName,
    },
  });
}
