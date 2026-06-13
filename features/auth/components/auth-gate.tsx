"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthLoadBoundary } from "@/components/layout/auth-load-boundary";
import { LoadingState, ErrorState } from "@/components/layout/state-view";
import { useAuthRole } from "@/hooks/use-auth-role";
import { roleLoginRoutes, type AppRole } from "@/types";

interface AuthGateProps {
  allowedRoles: AppRole[];
  directAccessMessage?: string;
  loginHref?: string;
  children: React.ReactNode;
}

function resolveLoginHref(allowedRoles: AppRole[], loginHref?: string): string {
  if (loginHref) {
    return loginHref;
  }

  const primaryRole = allowedRoles[0];
  return primaryRole ? roleLoginRoutes[primaryRole] : "/login";
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

  useEffect(() => {
    if (!loading && !user && !directAccessMessage) {
      router.replace(resolvedLoginHref);
    }
  }, [directAccessMessage, loading, resolvedLoginHref, router, user]);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="content-shell">
          <LoadingState waitingComponent="AuthGate" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="content-shell">
          <ErrorState
            title={directAccessMessage ? "تعذر التحقق من صلاحية الوصول" : "حدث خطأ"}
            description={directAccessMessage ?? error}
            actionHref={resolvedLoginHref}
            actionLabel="العودة إلى تسجيل الدخول"
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return directAccessMessage ? (
      <main className="page-shell">
        <div className="content-shell max-w-3xl pt-12">
          <ErrorState
            title="يلزم تسجيل الدخول"
            description={directAccessMessage}
            actionHref={resolvedLoginHref}
            actionLabel="العودة إلى تسجيل الدخول"
          />
        </div>
      </main>
    ) : null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <main className="page-shell">
        <div className="content-shell">
          <ErrorState
            title="ليست لديك صلاحية لعرض هذه الصفحة"
            description="يرجى تسجيل الدخول بالحساب المناسب."
            actionHref={resolvedLoginHref}
            actionLabel="العودة إلى تسجيل الدخول"
          />
        </div>
      </main>
    );
  }

  return <AuthLoadBoundary>{children}</AuthLoadBoundary>;
}
