"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CompetitionResetDialogProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CompetitionResetDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: CompetitionResetDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#143A5A]/40 p-4"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <Card
        className="w-full max-w-lg border-destructive/25 shadow-2xl"
        role="alertdialog"
        aria-labelledby="competition-reset-title"
        aria-describedby="competition-reset-description"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader>
          <CardTitle id="competition-reset-title" className="text-destructive">
            إعادة تعيين المسابقة
          </CardTitle>
          <div
            id="competition-reset-description"
            className="space-y-3 pt-2 text-sm leading-7 text-muted-foreground"
          >
            <p className="font-bold text-foreground">تحذير:</p>
            <p className="leading-7">
              سيتم حذف جميع الإجابات وإعادة تعيين نقاط الفرق وتقدم المراحل.
            </p>
            <p className="font-bold text-destructive">لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            disabled={loading}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {loading ? "جاري إعادة التعيين..." : "تأكيد إعادة التعيين"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
