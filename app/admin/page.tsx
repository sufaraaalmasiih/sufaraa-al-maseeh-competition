"use client";

import Link from "next/link";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitionResetPanel } from "@/features/gameflow/components/competition-reset-panel";

export default function AdminPage() {
  return (
    <AuthGate
      allowedRoles={["super_admin"]}
      directAccessMessage="لوحة المشرف العام جاهزة للوصول المباشر. سجّل الدخول بحساب المشرف العام للمتابعة."
    >
      <main className="page-shell">
        <div className="content-shell">
          <AppHeader title="لوحة المشرف العام" />
          <Card>
            <CardHeader>
              <CardTitle>لوحة المشرف العام</CardTitle>
              <CardDescription>
                وصول سريع لأدوات التشغيل المتاحة في مرحلة التطوير الحالية.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-md border border-primary/15 bg-[#F3FAFF] px-4 py-3 text-sm leading-7 text-muted-foreground">
                لاختبار أدوار مختلفة على الجهاز نفسه، استخدم متصفحات منفصلة أو
                نافذة خفية لأن جلسة Firebase Auth مشتركة داخل المتصفح الواحد.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild>
                  <Link href="/facilitator">فتح لوحة الميسر</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dev/create-admin-user">إنشاء حساب إدارة (تطوير)</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <CompetitionResetPanel />
        </div>
      </main>
    </AuthGate>
  );
}
