"use client";

import Link from "next/link";
import { CreateFacilitatorForm } from "@/features/auth/components/create-facilitator-form";
import { CompetitionResetPanel } from "@/features/gameflow/components/competition-reset-panel";
import { FacilitatorStaffPanel } from "@/features/facilitator/components/facilitator-staff-panel";
import { FacilitatorAllTeamsPanel } from "@/features/facilitator/components/facilitator-all-teams-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FacilitatorAdminTab() {
  return (
    <div className="facilitator-flow space-y-5">
      <Card className="facilitator-card">
        <CardHeader>
          <CardTitle className="text-[#143A5A]">إدارة النظام</CardTitle>
          <CardDescription>
            هذه الأدوات متاحة للمشرف العام فقط — إنشاء الميسرين وإدارة دورة المسابقة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CreateFacilitatorForm />
          <FacilitatorStaffPanel />
          {process.env.NODE_ENV === "development" ? (
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/dev/create-admin-user">إنشاء حساب إدارة (تطوير فقط)</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <FacilitatorAllTeamsPanel />

      <CompetitionResetPanel />
    </div>
  );
}
