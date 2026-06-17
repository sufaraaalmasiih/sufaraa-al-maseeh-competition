"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-24 w-24 sm:h-28 sm:w-28",
};

const sizePx = {
  sm: 36,
  md: 44,
  lg: 56,
  xl: 112,
};

export function BrandLogoMark({ className, size = "md" }: BrandLogoMarkProps) {
  return (
    <div
      aria-hidden
      className={cn("relative shrink-0", sizeMap[size], className)}
    >
      <Image
        src="/brand/sufaraa-logo-transparent.png"
        alt=""
        fill
        priority={size === "xl"}
        sizes={`${sizePx[size]}px`}
        className="object-contain"
      />
    </div>
  );
}
