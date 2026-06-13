"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { ErrorState } from "@/components/layout/state-view";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <CompetitionGradientShell contentClassName="content-shell px-4 py-8">
      <ErrorState
        title="حدث خطأ غير متوقع"
        description="تعذر تحميل الصفحة. جرّب إعادة المحاولة."
      />
      <div className="mt-4 text-center">
        <Button type="button" onClick={() => reset()}>
          حاول مرة أخرى
        </Button>
      </div>
    </CompetitionGradientShell>
  );
}
