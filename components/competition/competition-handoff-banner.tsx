"use client";

interface CompetitionHandoffBannerProps {
  playerName: string;
}

export function CompetitionHandoffBanner({ playerName }: CompetitionHandoffBannerProps) {
  return (
    <div className="competition-handoff">
      <p className="text-sm font-bold text-[#143A5A] sm:text-base">
        أعطوا الجهاز إلى: <span className="text-primary">{playerName}</span>
      </p>
    </div>
  );
}
