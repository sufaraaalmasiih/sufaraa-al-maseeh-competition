"use client";

interface CompetitionFrozenBannerProps {
  frozen: boolean;
}

export function CompetitionFrozenBanner({ frozen }: CompetitionFrozenBannerProps) {
  if (!frozen) {
    return null;
  }

  return (
    <div className="competition-frozen-banner" role="status" aria-live="polite">
      <span className="competition-frozen-banner__dot" aria-hidden />
      المسابقة مجمّدة مؤقتاً — انتظر إشعار الميسّر
    </div>
  );
}
