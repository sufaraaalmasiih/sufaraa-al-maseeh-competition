export function computeStage4PointsForCorrect(streakIncludingThis: number): number {
  if (streakIncludingThis < 1) {
    return 0;
  }

  return 15 + (streakIncludingThis - 1) * 2;
}

export function resolveStage4StreakAfterAnswer(
  streakBefore: number,
  isCorrect: boolean,
  passed: boolean,
): number {
  if (passed || !isCorrect) {
    return 0;
  }

  return streakBefore + 1;
}

export function computeStage4NextCorrectPoints(streak: number): number {
  return computeStage4PointsForCorrect(streak + 1);
}
