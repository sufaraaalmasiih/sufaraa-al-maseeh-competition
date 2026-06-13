"use client";

interface CompetitionFieldSuccessProps {
  fieldLabel: string;
}

export function CompetitionFieldSuccess({ fieldLabel }: CompetitionFieldSuccessProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/30 px-4 backdrop-blur-md">
      <div className="motion-success glass-surface w-full max-w-md px-8 py-10 text-center">
        <p className="text-5xl leading-none sm:text-6xl" aria-hidden>
          🎉
        </p>
        <p className="mt-4 text-3xl font-black text-[#143A5A] sm:text-4xl">أحسنتم!</p>
        <p className="mt-2 text-lg font-bold text-[#4F8A10] sm:text-xl">
          تم إنهاء مجال {fieldLabel}
        </p>
      </div>
    </div>
  );
}

export const SuccessOverlay = CompetitionFieldSuccess;
