import { seededShuffleStage1Parts } from "@/features/stage1/stage1-arrange";

export function getStage2ArrangeDisplayFragments(
  fragments: string[],
  shuffleSeed: string,
): string[] {
  return seededShuffleStage1Parts([...fragments], shuffleSeed);
}

export function isStage2ArrangeOrderCorrect(
  orderedFragments: string[],
  correctOrder: string[],
): boolean {
  if (orderedFragments.length !== correctOrder.length) {
    return false;
  }

  return orderedFragments.every(
    (fragment, index) => fragment === correctOrder[index],
  );
}
