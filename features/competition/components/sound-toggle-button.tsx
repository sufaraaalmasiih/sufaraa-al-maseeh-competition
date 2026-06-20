"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSoundMuteToggle } from "@/features/competition/use-competition-sound-cues";

/** زر عائم لكتم/تشغيل المؤثّرات الصوتية (لكل جهاز) — على شاشتي الجمهور والمتسابق. */
export function SoundToggleButton() {
  const { muted, toggle } = useSoundMuteToggle();
  const label = muted ? "تشغيل الصوت" : "كتم الصوت";

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#143A5A]/80 text-white shadow-lg backdrop-blur transition hover:bg-[#143A5A]"
    >
      {muted ? (
        <VolumeX className="h-5 w-5" aria-hidden />
      ) : (
        <Volume2 className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
