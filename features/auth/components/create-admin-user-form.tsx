"use client";

import { FirebaseError } from "firebase/app";
import { ShieldPlus } from "lucide-react";
import { useState } from "react";
import { createAdminSideUser } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import type { AppRole } from "@/types";

type AdminRole = Exclude<AppRole, "team">;

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
      title="إنشاء حساب إدارة"
      description="صفحة تطوير لإنشاء حسابات الجمهور والميسر والمشرف العام."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
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

        <div className="space-y-2">
          <Label htmlFor="role">الدور</Label>
          <select
            id="role"
            name="role"
            className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          >
            <option value="viewer">viewer</option>
            <option value="facilitator">facilitator</option>
            <option value="super_admin">super_admin</option>
          </select>
        </div>

        <Button className="w-full" size="lg" disabled={isSubmitting}>
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
