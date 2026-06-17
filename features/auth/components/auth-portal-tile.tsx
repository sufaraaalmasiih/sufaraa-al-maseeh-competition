"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthPortalTileProps {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "audience" | "dev";
  prefetch?: boolean;
  spanFull?: boolean;
}

export function AuthPortalTile({
  href,
  label,
  hint,
  icon: Icon,
  tone = "default",
  prefetch = true,
  spanFull = false,
}: AuthPortalTileProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={cn(
        "auth-portal-tile",
        `auth-portal-tile--${tone}`,
        spanFull && "auth-portal-tile--span-full",
        pending && "auth-portal-tile--pending",
      )}
    >
      <span className="auth-portal-tile__icon" aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="auth-portal-tile__copy">
        <span className="auth-portal-tile__label">{label}</span>
        <span className="auth-portal-tile__hint">{hint}</span>
      </span>
    </Link>
  );
}
