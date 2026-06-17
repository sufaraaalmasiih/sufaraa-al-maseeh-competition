"use client";

import { useEffect, useState } from "react";
import { isNavigationFetchError } from "@/lib/navigation-fetch-error";

export function DevServerRecovery() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showBanner = () => {
      setVisible(true);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isNavigationFetchError(event.reason)) {
        showBanner();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isNavigationFetchError(event.error ?? event.message)) {
        showBanner();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[10000] border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950 shadow-md"
      role="alert"
    >
      السيرفر المحلي لا يستجيب (Failed to fetch). أوقف العملية على المنفذ 3000 ثم شغّل{" "}
      <code className="rounded bg-amber-100 px-1.5 py-0.5">npm run dev:clean</code> وأعد تحميل
      الصفحة.
      <button
        type="button"
        className="ms-3 rounded-md border border-amber-400 px-2 py-0.5 text-xs"
        onClick={() => window.location.reload()}
      >
        إعادة التحميل
      </button>
    </div>
  );
}
