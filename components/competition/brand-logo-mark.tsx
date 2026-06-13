"use client";

import { cn } from "@/lib/utils";

interface BrandLogoMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-20 w-20 sm:h-24 sm:w-24",
};

export function BrandLogoMark({ className, size = "md" }: BrandLogoMarkProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_4px_18px_rgba(20,58,90,0.1)]",
        sizeMap[size],
        className,
      )}
    >
      <svg className="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="url(#brand-bg)" />
        <path
          d="M14 34V14h12c4.5 0 7.5 2.5 7.5 6.5S30.5 27 26 27H20v7h-6z"
          fill="#143A5A"
          opacity="0.92"
        />
        <path d="M20 18h5.5c2.2 0 3.5 1.1 3.5 2.8S27.7 23.5 25.5 23.5H20V18z" fill="#2388C4" />
        <path
          d="M30 30c3-1.5 6-4 8-7 1.5 2.5 1.5 5.5 0 8-2 1-4.5 1.2-8 .5z"
          fill="#4F8A10"
          opacity="0.9"
        />
        <circle cx="34" cy="16" r="3" fill="#F3BC2D" opacity="0.85" />
        <defs>
          <linearGradient id="brand-bg" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FCFF" />
            <stop offset="1" stopColor="#EEF6FB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
