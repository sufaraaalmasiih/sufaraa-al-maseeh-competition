"use client";

import { Maximize2 } from "lucide-react";
import { useAudienceNativeFullscreen } from "@/features/audience/use-audience-fullscreen";

/**
 * زر ملء الشاشة الذاتي على شاشة الجمهور — ملء الشاشة الأصلي يجب أن يُفعَّل بضغطة
 * محلية على جهاز العرض (قيد المتصفّح)، فيظهر هنا دائماً ما لم نكن في وضع ملء الشاشة.
 */
export function AudienceFullscreenPrompt() {
  const { active, enter } = useAudienceNativeFullscreen();

  if (active) {
    return null;
  }

  return (
    <button
      type="button"
      className="audience-fs-fab"
      onClick={() => void enter()}
      title="ملء الشاشة"
      aria-label="ملء الشاشة"
    >
      <Maximize2 className="h-5 w-5" aria-hidden />
      <span className="audience-fs-fab__label">ملء الشاشة</span>
    </button>
  );
}
