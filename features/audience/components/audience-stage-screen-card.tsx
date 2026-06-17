"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AudienceStageScreenTone = "green" | "blue";

interface AudienceStageScreenCardProps {
  badge: string;
  title: string;
  subtitle?: string;
  tone?: AudienceStageScreenTone;
  className?: string;
  screenClassName?: string;
  animateContent?: boolean;
  children: ReactNode;
}

export function AudienceStageScreenCard({
  badge,
  title,
  subtitle,
  tone = "green",
  className,
  screenClassName,
  animateContent = true,
  children,
}: AudienceStageScreenCardProps) {
  return (
    <section
      className={cn(
        "competition-stage-screen competition-stage-screen--animated audience-stage-finished",
        screenClassName,
      )}
    >
      <motion.div
        className={cn("competition-stage-screen__card glass-card-white", className)}
        initial={animateContent ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          className={cn(
            "competition-stage-screen__badge",
            tone === "blue" && "competition-stage-screen__badge--blue",
          )}
        >
          {badge}
        </span>
        <h2 className="competition-stage-screen__title">{title}</h2>
        {subtitle ? <p className="competition-stage-screen__subtitle">{subtitle}</p> : null}
        <motion.div
          className="audience-stage-screen-card__body"
          initial={animateContent ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}
