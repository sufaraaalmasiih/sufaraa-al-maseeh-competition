"use client";

import { useEffect, useRef } from "react";

/**
 * تحجيم ذكي للوحة الترتيب على شاشة الجمهور كي تملأ الارتفاع المتاح بسلاسة مهما كان
 * عدد الفرق — بلا قفزات أحجام ثابتة بين 11 و12 فريقاً مثلاً:
 *
 * 1) يقيس الارتفاع الطبيعي للمحتوى والإطار المتاح (ResizeObserver).
 * 2) يحسب مُعامل تحجيم متّصلاً = المتاح / الطبيعي، محصوراً بين MIN_SCALE و1.
 *    - السقف 1: الأعداد القليلة لا تتضخّم (تبقى بحجمها الطبيعي، بلا فراغ مبالَغ).
 *    - متّصل: لا قفزات — 11 و12 فريقاً يبدوان متقاربين.
 * 3) إن لم يتّسع حتى عند أصغر حجم (أعداد ضخمة جداً) يُفعّل تمريراً تلقائياً بطيئاً.
 *
 * عند الأعداد القليلة التي تتّسع كاملة بحجمها الطبيعي لا يُطبَّق أيّ تحجيم ولا تمرير،
 * فلا تتأثّر التجربة المعتادة إطلاقاً.
 */
const MIN_SCALE = 0.62;

export function useAutoScrollFit(recomputeKey: number | string = 0) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) {
      return undefined;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let animation: Animation | null = null;

    const stopAnimation = () => {
      animation?.cancel();
      animation = null;
    };

    let scheduled = false;
    const recompute = () => {
      scheduled = false;
      stopAnimation();

      // scrollHeight لا يتأثّر بالـtransform، فهو الارتفاع الطبيعي دائماً.
      const natural = content.scrollHeight;
      const avail = viewport.clientHeight;
      if (natural <= 0 || avail <= 0) {
        return;
      }

      const scale = Math.max(MIN_SCALE, Math.min(1, avail / natural));
      content.style.transformOrigin = "top center";
      content.style.transform = scale < 0.999 ? `scale(${scale})` : "";

      // الارتفاع بعد التحجيم؛ إن بقي أكبر من المتاح (أعداد ضخمة عند أصغر حجم) نمرّر.
      const visibleHeight = natural * scale;
      const overflow = visibleHeight - avail;
      if (overflow <= 6 || prefersReduced) {
        return;
      }

      const PX_PER_SECOND = 40;
      const scrollMs = (overflow / PX_PER_SECOND) * 1000;
      const pauseMs = 2600;
      const total = scrollMs * 2 + pauseMs * 2;
      const top = `scale(${scale}) translateY(0px)`;
      const bottom = `scale(${scale}) translateY(${-(overflow / scale)}px)`;

      animation = content.animate(
        [
          { transform: top, offset: 0 },
          { transform: top, offset: pauseMs / total },
          { transform: bottom, offset: (pauseMs + scrollMs) / total },
          { transform: bottom, offset: (pauseMs * 2 + scrollMs) / total },
          { transform: top, offset: 1 },
        ],
        { duration: total, iterations: Infinity, easing: "ease-in-out" },
      );
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      // setTimeout بدل requestAnimationFrame: الأخير يتوقّف عندما تكون الصفحة غير
      // مرئية (تبويب الجمهور في الخلفية / شاشة ثانية)، فلا يُعاد القياس أبداً.
      window.setTimeout(recompute, 0);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(content);
    schedule();

    // إعادة قياس مجدوَلة تلتقط الحالة المستقرّة بعد العدّ التنازلي وأنيميشن الكشف
    // التصاعدي (لا يضمنها ResizeObserver وحده لأنّ بعض الحركة لا تغيّر صندوق التخطيط).
    const timers = [300, 1200, 3000, 6000, 9000].map((ms) =>
      window.setTimeout(schedule, ms),
    );

    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      stopAnimation();
      content.style.transform = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recomputeKey]);

  return { viewportRef, contentRef };
}
