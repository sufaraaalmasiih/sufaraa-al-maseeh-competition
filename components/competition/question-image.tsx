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
      {/* object-contain يحافظ على النسبة (طول/عرض/مربع) بلا قصّ؛
          والأحجام تكبر على الشاشات الأكبر وشاشة الجمهور (CSS في globals).
          صور خارجية (روابط Excel) — img عادي مقصود. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={trimmed}
        alt={alt}
        className="question-image-el max-h-72 max-w-full rounded-xl border border-primary/15 bg-white object-contain shadow-sm sm:max-h-80 md:max-h-[24rem]"
      />
    </div>
  );
}
