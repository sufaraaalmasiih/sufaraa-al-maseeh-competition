"use client";

import Link from "next/link";
import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  description: string;
  switchHref?: string;
  switchLabel?: string;
  variant?: "hub" | "form" | "form-wide";
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  description,
  switchHref,
  switchLabel,
  variant = "hub",
  children,
}: AuthLayoutProps) {
  const isHub = variant === "hub";

  return (
    <CompetitionGradientShell
      centerContent={variant !== "form-wide"}
      animateBackground={false}
      scrollable={isHub || variant === "form-wide"}
      className="app-viewport-fill"
      contentClassName={cn(
        "auth-screen__wrap",
        isHub && "auth-screen__wrap--hub",
        variant === "form-wide" && "auth-screen__wrap--form-wide",
      )}
    >
      <article
        className={cn(
          "auth-screen__card",
          isHub && "auth-screen__card--hub",
          variant === "form-wide" && "auth-screen__card--wide",
        )}
      >
        <header className="auth-screen__header">
          <BrandLogoMark className="auth-screen__logo" size="md" />
          <div className="auth-screen__brand">
            <p className="auth-screen__brand-name">سفراء المسيح</p>
            <h1 className="auth-screen__title">{title}</h1>
          </div>
        </header>

        {description ? <p className="auth-screen__lead">{description}</p> : null}

        <div className="auth-screen__body">{children}</div>

        {switchHref && switchLabel ? (
          <footer className="auth-screen__footer">
            <Link className="auth-screen__switch" href={switchHref}>
              {switchLabel}
            </Link>
          </footer>
        ) : null}
      </article>
    </CompetitionGradientShell>
  );
}
