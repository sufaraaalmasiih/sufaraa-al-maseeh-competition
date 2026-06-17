"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameReadyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  forcePressed?: boolean;
  onSuccess?: () => void;
  successDuration?: number;
}

export function SuccessParticles({
  buttonRef,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (!rect) {
    return null;
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return createPortal(
    <AnimatePresence>
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed z-[9999] h-2 w-2 rounded-full bg-white"
          style={{ left: centerX, top: centerY }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (index % 2 ? 1 : -1) * (Math.random() * 56 + 24)],
            y: [0, -Math.random() * 56 - 24],
          }}
          transition={{
            duration: 0.55,
            delay: index * 0.06,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>,
    document.body,
  );
}

export function GameReadyButton({
  children,
  className,
  disabled,
  forcePressed = false,
  onClick,
  onSuccess,
  successDuration = 900,
  type = "button",
  ...props
}: GameReadyButtonProps) {
  const [showParticles, setShowParticles] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isPressed = forcePressed || showParticles;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || forcePressed) {
      return;
    }

    setShowParticles(true);
    window.setTimeout(() => {
      setShowParticles(false);
    }, successDuration);

    void Promise.resolve(onClick?.(event)).then(() => {
      onSuccess?.();
    });
  };

  return (
    <>
      {showParticles ? <SuccessParticles buttonRef={buttonRef} /> : null}
      <button
        ref={buttonRef}
        type={type}
        disabled={disabled || forcePressed}
        onClick={handleClick}
        className={cn("game-ready-btn", isPressed && "game-ready-btn--pressed", className)}
        {...props}
      >
        <span className="game-ready-btn__label">{children}</span>
      </button>
    </>
  );
}
