"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ParticleButtonProps extends ButtonProps {
  onSuccess?: () => void;
  successDuration?: number;
  showClickIcon?: boolean;
  slideHover?: boolean;
}

function SuccessParticles({
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
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed z-[9999] h-1.5 w-1.5 rounded-full bg-white"
          style={{ left: centerX, top: centerY }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (index % 2 ? 1 : -1) * (Math.random() * 50 + 20)],
            y: [0, -Math.random() * 50 - 20],
          }}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>,
    document.body,
  );
}

const READY_BUTTON_CLASSES =
  "h-14 w-full gap-2 rounded-full border-0 bg-[#7bc83e] text-lg font-bold text-white shadow-[inset_0_0_1.6em_-0.6em_#4f8f1a] hover:bg-[#72be38] hover:text-white disabled:cursor-not-allowed disabled:bg-gradient-to-b disabled:from-[#a8bdd0] disabled:to-[#8fa4b8] disabled:opacity-65 disabled:shadow-none";

function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 1000,
  className,
  disabled,
  variant = "ghost",
  showClickIcon = false,
  slideHover = false,
  type = "button",
  ...props
}: ParticleButtonProps) {
  const [showParticles, setShowParticles] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
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

  const label = slideHover ? (
    <span className="intro-ready-btn-slide__label">{children}</span>
  ) : (
    children
  );

  return (
    <>
      {showParticles ? <SuccessParticles buttonRef={buttonRef} /> : null}
      <Button
        ref={buttonRef}
        type={type}
        variant={variant}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative transition-transform duration-100",
          slideHover
            ? "intro-ready-btn-slide !h-14 !rounded-2xl !border-0 !px-5 !text-lg !font-bold !opacity-90 hover:!bg-[#7bc83e]"
            : READY_BUTTON_CLASSES,
          showParticles && "scale-95",
          className,
        )}
        {...props}
      >
        {label}
        {showClickIcon ? (
          <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
      </Button>
    </>
  );
}

export { ParticleButton };
