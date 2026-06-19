"use client";

import { useEffect, useState } from "react";

// مؤقّت داخل Web Worker — المتصفح لا يخنقه في التبويبات الخلفية (بخلاف setInterval
// في الخيط الرئيسي الذي يُخنق إلى ~مرة في الدقيقة). هذا يبقي اكتشاف انتهاء المؤقّت
// والأتمتة يعملان حتى لو كانت نافذة الميسّر في الخلفية.
const WORKER_SRC =
  "let h;onmessage=function(e){var d=e.data||{};if(d.t==='start'){clearInterval(h);h=setInterval(function(){postMessage('t')},d.ms||250)}else if(d.t==='stop'){clearInterval(h)}};";

/** يُرجع عدّاداً يتزايد كل `intervalMs` من Web Worker (مقاوم للخنق في الخلفية). */
export function useWorkerTick(active: boolean, intervalMs = 250): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active || typeof window === "undefined" || typeof Worker === "undefined") {
      return undefined;
    }

    let worker: Worker | null = null;
    let url: string | null = null;
    let fallbackId: number | undefined;

    try {
      url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "application/javascript" }));
      worker = new Worker(url);
      worker.onmessage = () => setTick((value) => (value + 1) % 1_000_000);
      worker.postMessage({ t: "start", ms: intervalMs });
    } catch {
      // فشل إنشاء Worker (سياسة CSP مثلاً) → احتياطي على الخيط الرئيسي.
      fallbackId = window.setInterval(
        () => setTick((value) => (value + 1) % 1_000_000),
        intervalMs,
      );
    }

    return () => {
      if (worker) {
        worker.postMessage({ t: "stop" });
        worker.terminate();
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
      if (fallbackId !== undefined) {
        window.clearInterval(fallbackId);
      }
    };
  }, [active, intervalMs]);

  return tick;
}
