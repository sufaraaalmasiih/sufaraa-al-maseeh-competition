export function buildStage3AnswerId(questionId: string, teamId: string): string {
  return `stage3_${questionId}_${teamId}`;
}
