"use client";

import { cn } from "@/lib/utils";

interface QuestionImageProps {
  url?: string | null;
  alt?: string;
  className?: string;
}

export function QuestionImage({
  url,
  alt = "صورة السؤال",
  className,
}: QuestionImageProps) {
  const trimmed = typeof url === "string" ? url.trim() : "";

  if (!trimmed) {
    return null;
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <img
        src={trimmed}
        alt={alt}
        className="max-h-72 max-w-full rounded-xl border border-primary/15 bg-white object-contain shadow-sm"
      />
    </div>
  );
}
