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
import { startNewCompetition } from "@/features/competition-session/competition-session-controls";

type ToastKind = "success" | "error" | null;
type DialogMode = "reset" | "new" | null;

interface CompetitionResetPanelProps {
  description?: string;
}

export function CompetitionResetPanel({
  description = "إدارة دورة المسابقة: إعادة التعيين للاختبار، أو بدء مسابقة جديدة تُخرج كل اللاعبين.",
}: CompetitionResetPanelProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastKind>(null);
  const [lastAction, setLastAction] = useState<"reset" | "new" | null>(null);

  async function handleConfirm() {
    const action = dialogMode === "new" ? "new" : "reset";
    setLoading(true);
    setToast(null);
    try {
      if (dialogMode === "new") {
        await startNewCompetition();
      } else {
        await resetCompetition();
      }
      setLastAction(action);
      setToast("success");
      setDialogMode(null);
    } catch {
      setToast("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="facilitator-settings-actions">
        <Card className="border-destructive/20 facilitator-settings-actions__card">
          <CardHeader>
            <CardTitle className="text-[#143A5A]">إعادة تعيين المسابقة</CardTitle>
            <CardDescription>
              يحذف الإجابات ويعيد النقاط والتقدم. الفرق المسجّلة تبقى مسجّلة الدخول.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => {
                setToast(null);
                setDialogMode("reset");
              }}
            >
              {loading && dialogMode === "reset"
                ? "جاري إعادة التعيين..."
                : "إعادة تعيين المسابقة"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#2388C4]/25 facilitator-settings-actions__card">
          <CardHeader>
            <CardTitle className="text-[#143A5A]">بدء مسابقة جديدة</CardTitle>
            <CardDescription>
              مثل إعادة التعيين + إخراج كل اللاعبين من الجلسة. يجب على كل فريق إعادة تسجيل
              الدخول قبل المشاركة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={loading}
              onClick={() => {
                setToast(null);
                setDialogMode("new");
              }}
            >
              {loading && dialogMode === "new"
                ? "جاري بدء مسابقة جديدة..."
                : "بدء مسابقة جديدة"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {description ? <p className="text-sm font-semibold text-muted-foreground">{description}</p> : null}

      {toast === "success" ? (
        <p className="rounded-md border border-[#4F8A10]/30 bg-[#F1F9E8] px-4 py-3 text-sm font-bold text-[#4F8A10]">
          {lastAction === "new"
            ? "تم بدء مسابقة جديدة — سيُخرج اللاعبون تلقائياً لإعادة تسجيل الدخول"
            : "تمت إعادة تعيين المسابقة بنجاح"}
        </p>
      ) : null}
      {toast === "error" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          فشلت العملية، حاول مرة أخرى
        </p>
      ) : null}

      <CompetitionResetDialog
        loading={loading}
        open={dialogMode === "reset"}
        onCancel={() => {
          if (!loading) {
            setDialogMode(null);
          }
        }}
        onConfirm={() => void handleConfirm()}
      />

      {dialogMode === "new" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <Card className="w-full max-w-md border-[#2388C4]/25">
            <CardHeader>
              <CardTitle className="text-[#143A5A]">بدء مسابقة جديدة</CardTitle>
              <CardDescription>
                سيتم حذف الإجابات وإعادة ضبط النقاط، وسيُخرج جميع اللاعبين من حساباتهم
                تلقائياً. كل فريق يحتاج تسجيل دخول جديد.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setDialogMode(null)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                className="facilitator-btn facilitator-btn--primary"
                disabled={loading}
                onClick={() => void handleConfirm()}
              >
                {loading ? "جاري التنفيذ..." : "تأكيد بدء مسابقة جديدة"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
