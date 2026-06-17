"use client";

import { useEffect, useMemo, useState } from "react";

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

export function useGradualReveal<T>(
  items: T[],
  intervalMs = 700,
  options?: GradualRevealOptions,
): T[] {
  const [visibleCount, setVisibleCount] = useState(0);
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
    if (intervalMs <= 0 || timing.intervalMs <= 0) {
      setVisibleCount(items.length);
      return;
    }

    setVisibleCount(0);
    if (items.length === 0) {
      return;
    }

    setVisibleCount(Math.min(timing.batchSize, items.length));
    if (items.length <= timing.batchSize) {
      return;
    }

    let current = Math.min(timing.batchSize, items.length);
    const timer = window.setInterval(() => {
      current = Math.min(current + timing.batchSize, items.length);
      setVisibleCount(current);
      if (current >= items.length) {
        window.clearInterval(timer);
      }
    }, timing.intervalMs);

    return () => window.clearInterval(timer);
  }, [items, intervalMs, timing.batchSize, timing.intervalMs]);

  return items.slice(0, visibleCount);
}
