"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/layout/state-view";

interface AuthLoadBoundaryProps {
  children: ReactNode;
}

interface AuthLoadBoundaryState {
  hasError: boolean;
}

export class AuthLoadBoundary extends Component<
  AuthLoadBoundaryProps,
  AuthLoadBoundaryState
> {
  state: AuthLoadBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AuthLoadBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[AuthLoadBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell">
          <div className="content-shell">
            <ErrorState
              title="تعذر تحميل الصفحة"
              description="حدث خطأ أثناء تحميل التطبيق. أعد تحميل الصفحة أو سجّل الدخول من جديد."
              actionHref="/login"
              actionLabel="العودة إلى تسجيل الدخول"
            />
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
