"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionResetDialog } from "@/features/gameflow/components/competition-reset-dialog";
import { resetCompetition } from "@/features/gameflow/competition-reset";

type ToastKind = "success" | "error" | null;

interface CompetitionResetPanelProps {
  description?: string;
}

export function CompetitionResetPanel({
  description = "لإعادة اختبار المسابقة من حالة نظيفة: يحذف كل الإجابات ويعيد النقاط والتقدم ولوحة على المحك. لا يحذف الفرق المسجّلين.",
}: CompetitionResetPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastKind>(null);

  async function handleConfirm() {
    setLoading(true);
    setToast(null);
    try {
      await resetCompetition();
      setToast("success");
      setDialogOpen(false);
    } catch {
      setToast("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-[#143A5A]">إعادة تعيين المسابقة</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {toast === "success" ? (
            <p className="rounded-md border border-[#4F8A10]/30 bg-[#F1F9E8] px-4 py-3 text-sm font-bold text-[#4F8A10]">
              تمت إعادة تعيين المسابقة بنجاح
            </p>
          ) : null}
          {toast === "error" ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
              فشلت إعادة التعيين، حاول مرة أخرى
            </p>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => {
              setToast(null);
              setDialogOpen(true);
            }}
          >
            {loading ? "جاري إعادة التعيين..." : "إعادة تعيين المسابقة"}
          </Button>
        </CardContent>
      </Card>

      <CompetitionResetDialog
        loading={loading}
        open={dialogOpen}
        onCancel={() => {
          if (!loading) {
            setDialogOpen(false);
          }
        }}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
