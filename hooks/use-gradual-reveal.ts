"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface GradualRevealOptions {
  /** Target total reveal duration regardless of team count */
  maxDurationMs?: number;
  /** Never reveal faster than this per row */
  minIntervalMs?: number;
  /** Reveal multiple rows per tick when the list is long */
  batchSize?: number;
}

const DEFAULT_MAX_DURATION_MS = 8_000;
const DEFAULT_MIN_INTERVAL_MS = 90;
const DEFAULT_BATCH_SIZE = 1;

function resolveRevealTiming(
  count: number,
  intervalMs: number,
  options?: GradualRevealOptions,
): { intervalMs: number; batchSize: number } {
  if (count <= 1) {
    return { intervalMs: 0, batchSize: 1 };
  }

  const maxDurationMs = options?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
  const minIntervalMs = options?.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const budgetInterval = maxDurationMs / count;
  const resolvedInterval = Math.max(
    minIntervalMs,
    Math.min(intervalMs, budgetInterval),
  );

  let batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  if (count > 20 && batchSize === DEFAULT_BATCH_SIZE) {
    batchSize = count > 35 ? 3 : 2;
  }

  return { intervalMs: resolvedInterval, batchSize };
}

/** مفتاح ثابت للصفوف — لا يعتمد على مرجع المصفوفة (يمنع إعادة ضبط الإعلان كل render). */
export function getGradualRevealSequenceKey<T>(items: T[]): string {
  return items
    .map((item, index) => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.answerDocId === "string" && record.answerDocId.length > 0) {
          return record.answerDocId;
        }
        if (typeof record.teamId === "string" && record.teamId.length > 0) {
          return record.teamId;
        }
        if (typeof record.id === "string" && record.id.length > 0) {
          return record.id;
        }
      }
      return `row:${index}`;
    })
    .join("|");
}

export function useGradualReveal<T>(
  items: T[],
  intervalMs = 700,
  options?: GradualRevealOptions,
): T[] {
  const [visibleCount, setVisibleCount] = useState(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const sequenceKey = getGradualRevealSequenceKey(items);
  const maxDurationMs = options?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
  const minIntervalMs = options?.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const batchSizeOption = options?.batchSize ?? DEFAULT_BATCH_SIZE;

  const timing = useMemo(
    () =>
      resolveRevealTiming(items.length, intervalMs, {
        maxDurationMs,
        minIntervalMs,
        batchSize: batchSizeOption,
      }),
    [items.length, intervalMs, maxDurationMs, minIntervalMs, batchSizeOption],
  );

  useEffect(() => {
    const count = itemsRef.current.length;

    if (intervalMs <= 0 || timing.intervalMs <= 0) {
      setVisibleCount(count);
      return;
    }

    setVisibleCount(Math.min(timing.batchSize, count));
    if (count <= timing.batchSize) {
      return;
    }

    let current = Math.min(timing.batchSize, count);
    const timer = window.setInterval(() => {
      current = Math.min(current + timing.batchSize, count);
      setVisibleCount(current);
      if (current >= count) {
        window.clearInterval(timer);
      }
    }, timing.intervalMs);

    return () => window.clearInterval(timer);
  }, [sequenceKey, intervalMs, timing.batchSize, timing.intervalMs]);

  if (intervalMs <= 0 || timing.intervalMs <= 0) {
    return items;
  }

  return items.slice(0, visibleCount);
}
