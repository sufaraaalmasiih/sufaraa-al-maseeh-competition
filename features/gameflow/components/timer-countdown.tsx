interface TimerCountdownProps {
  remainingSeconds: number;
  isExpired: boolean;
  paused?: boolean;
  label?: string;
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
}: TimerCountdownProps) {
  return (
    <div className="rounded-lg border border-primary/15 bg-gradient-to-br from-white to-[#F3FAFF] p-6 text-center shadow-[0_14px_35px_rgba(20,58,90,0.08)]">
      <p className="text-sm font-bold text-[#4F8A10]">{label}</p>
      <p className="mt-3 text-6xl font-extrabold tabular-nums text-[#143A5A] sm:text-7xl">
        {formatRemainingTime(remainingSeconds)}
      </p>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {paused
          ? "المؤقت موقوف مؤقتاً"
          : isExpired
            ? "انتهى الوقت"
            : "تابعوا الوقت المتبقي بهدوء"}
      </p>
    </div>
  );
}
