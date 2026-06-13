"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamLogoBadgeProps {
  logoUrl?: string | null;
  teamName: string;
  className?: string;
  variant?: "default" | "hud" | "header";
}

export function TeamLogoBadge({
  logoUrl,
  teamName,
  className,
  variant = "default",
}: TeamLogoBadgeProps) {
  const sizeClass =
    variant === "header" ? "h-12 w-12 sm:h-[3.35rem] sm:w-[3.35rem]" : variant === "hud" ? "h-9 w-9" : "h-10 w-10";

  if (logoUrl) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-full border border-white/80 bg-white/90 shadow-[0_2px_10px_rgba(20,58,90,0.08)]",
          sizeClass,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`شعار ${teamName}`}
          className="h-full w-full object-cover"
          src={logoUrl}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-[0_2px_10px_rgba(20,58,90,0.08)]",
        variant === "hud" ? "border-primary/15" : "border-primary/25",
        sizeClass,
        className,
      )}
    >
      <Users
        aria-hidden
        className={variant === "header" ? "h-6 w-6 text-primary" : "h-4 w-4 text-primary"}
      />
    </div>
  );
}
