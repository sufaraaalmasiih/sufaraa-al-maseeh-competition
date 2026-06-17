"use client";

import { Maximize2 } from "lucide-react";
import { useAudienceNativeFullscreen } from "@/features/audience/use-audience-fullscreen";

interface AudienceFullscreenPromptProps {
  enabled: boolean;
}

export function AudienceFullscreenPrompt({ enabled }: AudienceFullscreenPromptProps) {
  const { active, enter } = useAudienceNativeFullscreen();

  if (!enabled || active) {
    return null;
  }

  return (
    <div className="audience-fullscreen-prompt">
      <p className="audience-fullscreen-prompt__text">
        وضع العرض الكامل مفعّل من لوحة الميسر. اضغط الزر أدناه لملء الشاشة على هذا الجهاز.
      </p>
      <button type="button" className="audience-fullscreen-prompt__button" onClick={() => void enter()}>
        <Maximize2 className="h-4 w-4" aria-hidden />
        ملء الشاشة الآن
      </button>
    </div>
  );
}
