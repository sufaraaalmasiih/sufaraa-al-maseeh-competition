"use client";

import { useEffect } from "react";
import { bindAudioUnlock, bindUiClickSounds } from "@/lib/competition-sound-cues";

/** يفعّل فك قفل الصوت ومؤثرات النقر على مستوى التطبيق. */
export function AppSoundBindings() {
  useEffect(() => {
    bindAudioUnlock();
    bindUiClickSounds();
  }, []);

  return null;
}
