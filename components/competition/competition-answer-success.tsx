"use client";

import { CheckCircle2 } from "lucide-react";

export function CompetitionAnswerSuccess() {
  return (
    <div className="answer-success-glass">
      <p className="flex items-center justify-center gap-2 text-base font-black text-[#4F8A10] sm:text-lg">
        <CheckCircle2 className="h-5 w-5" />
        تم تأكيد الإجابة
      </p>
    </div>
  );
}
