"use client";

import { useCallback, useEffect, useState } from "react";

export function useNativeFullscreen() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function syncState() {
      setActive(document.fullscreenElement === document.documentElement);
    }

    syncState();
    document.addEventListener("fullscreenchange", syncState);

    return () => {
      document.removeEventListener("fullscreenchange", syncState);
    };
  }, []);

  const enter = useCallback(async () => {
    if (document.fullscreenElement) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser may block without user gesture or unsupported context.
    }
  }, []);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  return { active, enter, exit };
}
