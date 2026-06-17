"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bootstrapCompetitionDatabase } from "@/features/gameflow/competition-bootstrap";

interface CompetitionBootstrapPanelProps {
  showWhenReady?: boolean;
}

export function CompetitionBootstrapPanel({
  showWhenReady = false,
}: CompetitionBootstrapPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBootstrap() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await bootstrapCompetitionDatabase();
      if (result.created.length === 0) {
        setMessage("قاعدة البيانات جاهزة مسبقاً — لم يُنشأ أي مستند جديد.");
      } else {
        setMessage(
          `تم إنشاء: ${result.created.join("، ")}. يمكنك الآن فتح شاشة الانتظار والجمهور.`,
        );
      }
    } catch {
      setError("تعذر تهيئة قاعدة البيانات. تأكد أنك مسجّل كميسّر وأن قواعد Firestore منشورة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-[#2388C4]/25 facilitator-settings-actions__card">
      <CardHeader>
        <CardTitle className="text-[#143A5A]">تهيئة قاعدة البيانات</CardTitle>
        <CardDescription>
          {showWhenReady
            ? "قاعدة Firestore جديدة أو فارغة؟ أنشئ مستندات النظام الأساسية (سير المسابقة، المؤقت، الجلسة)."
            : "للاستخدام عند أول تشغيل على Firebase — يُنشئ المستندات الناقصة فقط دون حذف بيانات."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          className="facilitator-btn facilitator-btn--primary w-full sm:w-auto"
          disabled={loading}
          onClick={() => void handleBootstrap()}
        >
          <Database className="h-4 w-4" aria-hidden />
          {loading ? "جاري التهيئة..." : "تهيئة قاعدة البيانات"}
        </Button>

        {message ? (
          <p className="rounded-md border border-[#4F8A10]/30 bg-[#F1F9E8] px-4 py-3 text-sm font-bold text-[#4F8A10]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
