"use client";

import { Maximize2 } from "lucide-react";
import { useNativeFullscreen } from "@/hooks/use-native-fullscreen";

export function TeamFullscreenPrompt() {
  const { active, enter } = useNativeFullscreen();

  if (active) {
    return null;
  }

  return (
    <div className="team-fullscreen-prompt">
      <button type="button" className="team-fullscreen-prompt__button" onClick={() => void enter()}>
        <Maximize2 className="h-4 w-4" aria-hidden />
        ملء الشاشة
      </button>
    </div>
  );
}
