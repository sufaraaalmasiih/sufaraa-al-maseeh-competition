"use client";

import { useEffect, useState } from "react";

export function useAudienceNativeFullscreen(): {
  active: boolean;
  enter: () => Promise<void>;
} {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    function syncState() {
      setActive(document.fullscreenElement === document.documentElement);
    }

    document.addEventListener("fullscreenchange", syncState);
    syncState();

    return () => {
      document.removeEventListener("fullscreenchange", syncState);
    };
  }, []);

  async function enter() {
    if (typeof document === "undefined" || !document.documentElement.requestFullscreen) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browsers require a user gesture — the prompt button supplies it.
    }
  }

  return { active, enter };
}
