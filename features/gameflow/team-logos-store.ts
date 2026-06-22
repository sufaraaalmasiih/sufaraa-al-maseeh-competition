"use client";

import { collection } from "firebase/firestore";
import { useSyncExternalStore } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { subscribeFirestoreQuery } from "@/lib/firestore-listener";
import type { TeamLogoMap } from "@/lib/resolve-team-logo-url";

const EMPTY_MAP: TeamLogoMap = new Map();

let logos: TeamLogoMap = EMPTY_MAP;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | undefined;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function ensureSubscription(): void {
  if (unsubscribe) {
    return;
  }

  // المصدر = teamStates (قراءته عامة لكل الأدوار: الجمهور/المدرب/الفريق/الميسّر)، بدل
  // teams المقيّدة بالميسّر فقط — فلولاها يظهر شعار البديل (أيقونة) خارج لوحة الميسّر.
  unsubscribe = subscribeFirestoreQuery(
    collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "teamStates"),
    (snapshot) => {
      const next = new Map<string, string>();
      snapshot.docs.forEach((docSnap) => {
        const logoUrl = docSnap.data().logoUrl;
        if (typeof logoUrl === "string" && logoUrl.length > 0) {
          next.set(docSnap.id, logoUrl);
        }
      });
      logos = next;
      notify();
    },
    () => {
      logos = EMPTY_MAP;
      notify();
    },
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureSubscription();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TeamLogoMap {
  return logos;
}

export function useTeamLogosMap(): TeamLogoMap {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
