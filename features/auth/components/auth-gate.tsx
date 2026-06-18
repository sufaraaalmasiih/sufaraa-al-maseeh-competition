"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CompetitionBrandHeaderCard } from "@/components/competition/competition-brand-header-card";
import { AuthLoadBoundary } from "@/components/layout/auth-load-boundary";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { LoadingState, ErrorState } from "@/components/layout/state-view";
import { useCompetitionContentSync } from "@/features/competition-content/competition-content-runtime";
import { useAuthRole } from "@/hooks/use-auth-role";
import { roleLoginRoutes, type AppRole } from "@/types";

interface AuthGateProps {
  allowedRoles: AppRole[];
  directAccessMessage?: string;
  loginHref?: string;
  children: React.ReactNode;
}

const AUTH_GATE_GRACE_MS = 3_000;

function resolveLoginHref(allowedRoles: AppRole[], loginHref?: string): string {
  if (loginHref) {
    return loginHref;
  }

  const primaryRole = allowedRoles[0];
  return primaryRole ? roleLoginRoutes[primaryRole] : "/login";
}

function AuthGateMessageCard({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  useCompetitionContentSync();

  return (
    <CompetitionGradientShell
      centerContent
      className="app-viewport-fill"
      contentClassName="stage1-intro-screen__wrap px-4 py-6 sm:py-8"
    >
      <div className="team-flow-content team-flow-content--center-body w-full">
        <div className="team-flow-content__header">
          <CompetitionBrandHeaderCard centerLabel={title} />
        </div>

        <div className="team-flow-content__body w-full">
          <div className="stage1-intro-screen stage1-intro-screen--centered">
            <article className="stage1-intro-screen__card">
              <div className="stage1-intro-screen__body">
                <ErrorState
                  title={title}
                  description={description}
                  actionHref={actionHref}
                  actionLabel={actionLabel}
                />
              </div>
            </article>
          </div>
        </div>
      </div>
    </CompetitionGradientShell>
  );
}

export function AuthGate({
  allowedRoles,
  directAccessMessage,
  loginHref,
  children,
}: AuthGateProps) {
  const router = useRouter();
  const { user, role, loading, error } = useAuthRole();
  const resolvedLoginHref = resolveLoginHref(allowedRoles, loginHref);
  const [bootstrapReady, setBootstrapReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBootstrapReady(true);
    }, AUTH_GATE_GRACE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user && !directAccessMessage) {
      router.replace(resolvedLoginHref);
    }
  }, [directAccessMessage, loading, resolvedLoginHref, router, user]);

  const authStillPending = loading && !bootstrapReady;

  if (authStillPending) {
    return (
      <CompetitionGradientShell centerContent className="app-viewport-fill" contentClassName="app-loading-screen__content">
        <LoadingState variant="page" title="جاري التحقق من الحساب..." waitingComponent="AuthGate" />
      </CompetitionGradientShell>
    );
  }

  if (loading && bootstrapReady) {
    return (
      <CompetitionGradientShell centerContent className="app-viewport-fill" contentClassName="app-loading-screen__content">
        <ErrorState
          title="تعذر التحقق من الحساب"
          description="استغرق التحقق وقتاً أطول من المعتاد. أعد تحميل الصفحة أو سجّل الدخول من جديد."
          actionHref={resolvedLoginHref}
          actionLabel="العودة إلى تسجيل الدخول"
        />
      </CompetitionGradientShell>
    );
  }

  if (error) {
    return (
      <CompetitionGradientShell centerContent className="app-viewport-fill" contentClassName="app-loading-screen__content">
        <ErrorState
          title="تعذر التحقق من الحساب"
          description={error}
          actionHref={resolvedLoginHref}
          actionLabel="العودة إلى تسجيل الدخول"
        />
      </CompetitionGradientShell>
    );
  }

  if (!user) {
    if (!bootstrapReady) {
      return (
        <CompetitionGradientShell centerContent className="app-viewport-fill" contentClassName="app-loading-screen__content">
          <LoadingState variant="page" title="جاري التحقق من الحساب..." waitingComponent="AuthGate" />
        </CompetitionGradientShell>
      );
    }

    return directAccessMessage ? (
      <AuthGateMessageCard
        title="يلزم تسجيل الدخول"
        description={directAccessMessage}
        actionHref={resolvedLoginHref}
        actionLabel="العودة إلى تسجيل الدخول"
      />
    ) : null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <AuthGateMessageCard
        title="ليست لديك صلاحية لعرض هذه الصفحة"
        description="يرجى تسجيل الدخول بالحساب المناسب."
        actionHref={resolvedLoginHref}
        actionLabel="العودة إلى تسجيل الدخول"
      />
    );
  }

  return <AuthLoadBoundary>{children}</AuthLoadBoundary>;
}
