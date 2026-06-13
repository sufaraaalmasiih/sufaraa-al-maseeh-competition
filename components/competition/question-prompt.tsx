"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionPromptProps {
  children: React.ReactNode;
  reference?: string;
  className?: string;
  size?: "default" | "large" | "verse" | "hero" | "arena" | "arena-verse";
}

export function QuestionPrompt({
  children,
  reference,
  className,
  size = "default",
}: QuestionPromptProps) {
  const isArena = size === "arena" || size === "arena-verse";
  const isVersePanel = size === "verse" && !isArena;
  const showAccent = size === "hero" || size === "large";

  return (
    <div className={cn("competition-hero-question", showAccent && "competition-hero-question--accent", className)}>
      {showAccent ? (
        <div aria-hidden className="competition-hero-question-accent">
          <BookOpen className="h-4 w-4 text-[#2388C4]/70" strokeWidth={2.2} />
        </div>
      ) : null}
      {size === "arena-verse" ? (
        <p className="arena-question-verse">{children}</p>
      ) : isVersePanel ? (
        <div className="competition-hero-verse-panel">
          <p className="competition-hero-verse-text">{children}</p>
        </div>
      ) : (
        <p
          className={cn(
            size === "arena"
              ? "arena-question-text"
              : size === "hero" || size === "large"
                ? "competition-hero-question-text"
                : "text-2xl font-black leading-snug text-[#143A5A] md:text-3xl",
          )}
        >
          {children}
        </p>
      )}
      {reference ? (
        <p
          className={cn(
            "mt-3 font-bold",
            isArena ? "text-base text-[#3D7310] sm:text-lg" : "text-xs text-[#4F8A10] md:text-sm",
          )}
        >
          {reference}
        </p>
      ) : null}
    </div>
  );
}

export const QuestionHero = QuestionPrompt;
