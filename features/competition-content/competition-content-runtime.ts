"use client";

import { useEffect, useState } from "react";
import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import { mergeCompetitionContent } from "@/features/competition-content/competition-content-merge";
import { subscribeCompetitionContent } from "@/features/competition-content/competition-content-store";
import type { CompetitionContentDocument } from "@/features/competition-content/competition-content-types";

let cachedContent: CompetitionContentDocument = DEFAULT_COMPETITION_CONTENT;
let subscribed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function startSubscription() {
  if (subscribed) {
    return;
  }
  subscribed = true;

  subscribeCompetitionContent((content) => {
    cachedContent = content;
    notify();
  });
}

export function getCompetitionContent(): CompetitionContentDocument {
  return cachedContent;
}

export function useCompetitionContentSync(): void {
  const [, setVersion] = useState(0);

  useEffect(() => {
    startSubscription();
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

export function useCompetitionContent(): CompetitionContentDocument {
  useCompetitionContentSync();
  return getCompetitionContent();
}

export function resetCompetitionContentCache(): void {
  cachedContent = mergeCompetitionContent(null);
}
