"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

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
  const trimmed = normalizeImageUrl(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed) {
    return null;
  }

  if (failed) {
    return (
      <div className={cn("flex justify-center", className)}>
        <div className="max-w-full rounded-xl border border-[#F59E0B]/30 bg-[#FFF7ED] px-4 py-3 text-center text-sm font-bold text-[#92400E]">
          تعذر عرض صورة السؤال.
          <a
            className="mr-2 underline"
            href={trimmed}
            rel="noreferrer"
            target="_blank"
          >
            فتح الرابط
          </a>
        </div>
      </div>
    );
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
        onError={() => setFailed(true)}
      />
    </div>
  );
}
