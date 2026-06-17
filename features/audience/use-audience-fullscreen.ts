"use client";

import { useEffect, useState } from "react";
import { isAudienceEmbeddedView } from "@/features/audience/audience-display-utils";
import { audienceDisplayRef } from "@/firebase/firestore";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";

export function useAudienceFullscreenMode(): boolean {
  const [fullscreen, setFullscreen] = useState(false);
  const embedded = isAudienceEmbeddedView();

  useEffect(() => {
    return subscribeFirestoreDoc(
      audienceDisplayRef,
      (snapshot) => {
        setFullscreen(snapshot.data()?.fullscreen === true);
      },
      () => {
        setFullscreen(false);
      },
    );
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || embedded) {
      return;
    }

    const root = document.documentElement;

    if (fullscreen) {
      root.classList.add("audience-fullscreen-mode");
      return () => {
        root.classList.remove("audience-fullscreen-mode");
      };
    }

    root.classList.remove("audience-fullscreen-mode");
  }, [embedded, fullscreen]);

  return embedded ? false : fullscreen;
}

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
