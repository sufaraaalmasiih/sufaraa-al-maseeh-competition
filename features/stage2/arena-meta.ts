export function buildArenaMeta(parts: string[], remainingSeconds?: number | null): string {
  const segments = parts.filter((part) => part.trim().length > 0);

  if (typeof remainingSeconds === "number" && remainingSeconds >= 0) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    segments.push(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  }

  return segments.join(" • ");
}
