"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface TeamLogoBadgeProps {
  logoUrl?: string | null;
  teamName: string;
  className?: string;
  variant?: "default" | "hud" | "header" | "ranking";
}

export function TeamLogoBadge({
  logoUrl,
  teamName,
  className,
  variant = "default",
}: TeamLogoBadgeProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass =
    variant === "ranking"
      ? "h-14 w-14 sm:h-16 sm:w-16"
      : variant === "header"
        ? "h-12 w-12 sm:h-[3.35rem] sm:w-[3.35rem]"
        : variant === "hud"
          ? "h-9 w-9"
          : "h-10 w-10";

  const resolvedLogoUrl = normalizeImageUrl(logoUrl);

  useEffect(() => {
    setFailed(false);
  }, [resolvedLogoUrl]);

  if (resolvedLogoUrl && !failed) {
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
          src={resolvedLogoUrl}
          onError={() => setFailed(true)}
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
        className={cn(
          variant === "ranking" && "h-7 w-7 text-primary",
          variant === "header" && "h-6 w-6 text-primary",
          variant !== "ranking" && variant !== "header" && "h-4 w-4 text-primary",
        )}
      />
    </div>
  );
}
