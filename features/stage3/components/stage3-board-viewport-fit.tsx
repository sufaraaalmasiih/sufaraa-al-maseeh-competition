"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Stage3BoardViewportFitProps {
  children: ReactNode;
}

const MIN_SCALE = 0.68;

/**
 * Scales the stage 3 board when the natural layout exceeds the viewport so all
 * 6 question rows stay visible without page scroll.
 */
export function Stage3BoardViewportFit({ children }: Stage3BoardViewportFitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) {
      return undefined;
    }

    let frame = 0;

    const updateScale = () => {
      const availableHeight = outer.clientHeight;
      const availableWidth = outer.clientWidth;
      const naturalHeight = inner.scrollHeight;
      const naturalWidth = inner.scrollWidth;

      if (availableHeight <= 0 || naturalHeight <= 0 || availableWidth <= 0 || naturalWidth <= 0) {
        setScale(1);
        inner.style.zoom = "";
        return;
      }

      const heightScale = availableHeight / naturalHeight;
      const widthScale = availableWidth / naturalWidth;
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(1, heightScale, widthScale),
      );

      setScale(Number(nextScale.toFixed(4)));
      inner.style.zoom = nextScale < 1 ? String(nextScale) : "";
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(updateScale);
      });
    };

    scheduleUpdate();

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(outer);
    observer.observe(inner);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      inner.style.zoom = "";
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="stage3-board-viewport-fit"
      data-scale={scale < 1 ? scale : undefined}
    >
      <div ref={innerRef} className="stage3-board-viewport-fit__inner">
        {children}
      </div>
    </div>
  );
}
