interface TimerCountdownProps {
  remainingSeconds: number;
  isExpired: boolean;
  paused?: boolean;
  label?: string;
  variant?: "card" | "embedded" | "compact";
}

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function TimerCountdown({
  remainingSeconds,
  isExpired,
  paused = false,
  label = "وقت المرحلة الأولى",
  variant = "card",
}: TimerCountdownProps) {
  const wrapperClass =
    variant === "embedded"
      ? "competition-timer-embedded"
      : variant === "compact"
        ? "competition-timer-compact"
        : "rounded-lg border border-primary/15 bg-gradient-to-br from-white to-[#F3FAFF] p-6 text-center shadow-[0_14px_35px_rgba(20,58,90,0.08)]";

  const labelClass =
    variant === "embedded"
      ? "competition-timer-embedded__label"
      : variant === "compact"
        ? "competition-timer-compact__label"
        : "text-sm font-bold text-[#4F8A10]";

  const valueClass =
    variant === "embedded"
      ? "competition-timer-embedded__value"
      : variant === "compact"
        ? "competition-timer-compact__value"
        : "mt-3 text-5xl font-extrabold tabular-nums text-[#143A5A] sm:text-6xl";

  const hintClass =
    variant === "embedded"
      ? "competition-timer-embedded__hint"
      : variant === "compact"
        ? "competition-timer-compact__hint"
        : "mt-3 text-sm font-semibold text-muted-foreground";

  return (
    <div className={wrapperClass}>
      <p className={labelClass}>
        {label}
      </p>
      <p className={valueClass}>
        {formatRemainingTime(remainingSeconds)}
      </p>
      <p className={hintClass}>
        {paused
          ? "المؤقت موقوف مؤقتاً"
          : isExpired
            ? "انتهى الوقت"
            : "تابعوا الوقت المتبقي بهدوء"}
      </p>
    </div>
  );
}
