"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateViewProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

type LoadingStateVariant = "page" | "card" | "inline";

function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("loading-dots", className)} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

interface LoadingStateProps extends Partial<StateViewProps> {
  waitingComponent?: string;
  variant?: LoadingStateVariant;
}

export function LoadingState({
  title = "جاري التحميل...",
  variant = "card",
}: LoadingStateProps) {
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (variant === "inline") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSlowHint(true);
    }, 10_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [variant]);

  return (
    <div
      className={cn(
        "loading-state",
        variant === "page" && "loading-state--page",
        variant === "inline" && "loading-state--inline",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-state__card">
        <LoadingDots className="loading-state__icon" />
        <p className="loading-state__title">{title}</p>
        {showSlowHint ? (
          <p className="loading-state__slow-hint">
            يستغرق التحميل وقتاً أطول من المعتاد. أعد تحميل الصفحة أو تحقق من الاتصال.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  actionHref,
  actionLabel,
}: StateViewProps) {
  return (
    <div className="error-state">
      <div className="error-state__card">
        <h2 className="error-state__title">{title}</h2>
        {description ? <p className="error-state__description">{description}</p> : null}
        {actionHref && actionLabel ? (
          <Button asChild className="mt-5" variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
