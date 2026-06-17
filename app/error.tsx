"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { ErrorState } from "@/components/layout/state-view";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-load-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    console.error(error);
    if (chunkError) {
      reloadOnceForChunkError();
    }
  }, [chunkError, error]);

  const handleRetry = () => {
    if (chunkError) {
      window.location.reload();
      return;
    }

    reset();
  };

  return (
    <CompetitionGradientShell contentClassName="content-shell px-4 py-8">
      <ErrorState
        title={chunkError ? "تحديث التطبيق مطلوب" : "حدث خطأ غير متوقع"}
        description={
          chunkError
            ? process.env.NODE_ENV === "development"
              ? "ملفات التطبيق قديمة. أعد تشغيل السيرفر (`npm run dev:clean`) ثم حدّث الصفحة يدوياً."
              : "تم تحديث ملفات التطبيق. اضغط «حاول مرة أخرى» لإعادة التحميل."
            : "تعذر تحميل الصفحة. جرّب إعادة المحاولة."
        }
      />
      <div className="mt-4 text-center">
        <Button type="button" onClick={handleRetry}>
          حاول مرة أخرى
        </Button>
      </div>
    </CompetitionGradientShell>
  );
}
