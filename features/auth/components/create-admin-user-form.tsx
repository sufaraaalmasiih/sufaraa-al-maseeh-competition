"use client";

import { FirebaseError } from "firebase/app";
import { ShieldPlus } from "lucide-react";
import { useState } from "react";
import { createAdminSideUser } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type StaffRole,
} from "@/features/auth/roles";

type AdminRole = StaffRole;

const DEV_ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "facilitator", label: ROLE_LABELS.facilitator },
  { value: "super_admin", label: ROLE_LABELS.super_admin },
  { value: "viewer", label: ROLE_LABELS.viewer },
];

export function CreateAdminUserForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("facilitator");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createAdminSideUser({ fullName, email, password, role });
      setSuccess("تم إنشاء حساب الإدارة بنجاح");
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("facilitator");
    } catch (caughtError) {
      setError(getCreateAdminUserErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="إنشاء حساب إدارة (تطوير)"
      description="أداة محلية لتهيئة أول حسابات التشغيل أثناء التطوير. في الإنتاج، يُنشأ الميسر من لوحة المشرف العام فقط."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
      variant="form"
    >
      <div className="mb-5 rounded-xl border border-amber-300/35 bg-amber-50/90 px-4 py-3 text-sm leading-7 text-amber-950">
        <p className="font-bold">متى تُستخدم هذه الصفحة؟</p>
        <p className="mt-1">
          عند أول تشغيل محلي قبل وجود أي مشرف عام. تُنشئ حساب Firebase وتسجّل دخولك
          تلقائياً به. في الإنتاج لا تظهر في بوابة الدخول.
        </p>
      </div>
      <form className="auth-form" onSubmit={onSubmit}>
        {success ? <p className="text-sm font-bold text-[#4F8A10]">{success}</p> : null}
        {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="auth-form__field">
          <Label htmlFor="role">الدور</Label>
          <select
            id="role"
            name="role"
            className="auth-form__select"
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          >
            {DEV_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-6 text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <Button className="auth-form__submit" size="lg" disabled={isSubmitting}>
          <ShieldPlus className="h-5 w-5" />
          {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب الإدارة"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function getCreateAdminUserErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "هذا البريد الإلكتروني مستخدم بالفعل.";
    }
    if (error.code === "auth/weak-password") {
      return "كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.";
    }
    if (error.code === "permission-denied") {
      return "تعذر إنشاء ملف المستخدم بسبب صلاحيات قاعدة البيانات.";
    }
  }

  return "حدث خطأ غير معروف أثناء إنشاء حساب الإدارة.";
}
