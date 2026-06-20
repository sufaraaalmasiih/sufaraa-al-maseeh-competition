"use client";

import { useEffect, useMemo, useState } from "react";

const CONFETTI_COLORS = [
  "#FACC15",
  "#22C55E",
  "#3B82F6",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#F97316",
  "#06B6D4",
];

interface PodiumConfettiProps {
  pieces?: number;
}

/** انفجار كونفيتي على منصّة الفائزين (CSS فقط — بلا مكتبات ولا كلفة). */
export function PodiumConfetti({ pieces = 80 }: PodiumConfettiProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        index,
        left: Math.random() * 100,
        delay: Math.random() * 1.1,
        duration: 2.8 + Math.random() * 2.4,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 7 + Math.random() * 9,
        drift: (Math.random() - 0.5) * 160,
        spin: 540 + Math.random() * 540,
      })),
    [pieces],
  );

  // يُولَّد على العميل فقط (يتجنّب اختلاف الترطيب SSR).
  if (!mounted) {
    return null;
  }

  return (
    <div className="podium-confetti" aria-hidden>
      {items.map((piece) => (
        <span
          key={piece.index}
          className="podium-confetti__piece"
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size * 0.42}px`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-spin": `${piece.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
