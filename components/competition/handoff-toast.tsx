"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HandoffToastProps {
  playerName: string;
  durationMs?: number;
}

export function HandoffToast({ playerName, durationMs = 4000 }: HandoffToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [playerName, durationMs]);

  if (!visible) {
    return null;
  }

  return (
    <div className={cn("handoff-toast", "handoff-toast-enter")} role="status">
      أعطوا الجهاز إلى <span className="font-bold text-[#143A5A]/60">{playerName}</span>
    </div>
  );
}
