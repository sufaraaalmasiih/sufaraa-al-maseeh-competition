/** Pick a usable correct-order list; empty `correctOrder` falls back to `fallback`. */
export function resolveArrangeCorrectOrder(
  correctOrder: string[] | null | undefined,
  fallback: string[],
): string[] {
  if (Array.isArray(correctOrder) && correctOrder.length >= 2) {
    return correctOrder.map(String);
  }
  if (fallback.length >= 2) {
    return fallback.map(String);
  }
  return Array.isArray(correctOrder) ? correctOrder.map(String) : [];
}
