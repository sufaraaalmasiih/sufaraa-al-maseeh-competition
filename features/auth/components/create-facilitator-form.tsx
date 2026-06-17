"use client";

import { FirebaseError } from "firebase/app";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { createFacilitatorBySuperAdmin } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateFacilitatorForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createFacilitatorBySuperAdmin({ fullName, email, password });
      setSuccess("تم إنشاء حساب الميسر بنجاح. يمكنه الدخول من «دخول الميسر».");
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (caughtError) {
      setError(getCreateFacilitatorErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {success ? (
        <p className="rounded-xl border border-[#4F8A10]/25 bg-[#F1F9E8] px-4 py-3 text-sm font-bold text-[#356A0F]">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="facilitatorFullName">الاسم الكامل</Label>
        <Input
          id="facilitatorFullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facilitatorEmail">البريد الإلكتروني</Label>
        <Input
          id="facilitatorEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facilitatorPassword">كلمة المرور</Label>
        <Input
          id="facilitatorPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
      </div>

      <Button className="w-full" size="lg" disabled={isSubmitting}>
        <UserPlus className="h-5 w-5" />
        {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب ميسر"}
      </Button>
    </form>
  );
}

function getCreateFacilitatorErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "SUPER_ADMIN_REQUIRED") {
    return "يلزم تسجيل الدخول بحساب المشرف العام أولاً.";
  }

  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "هذا البريد الإلكتروني مستخدم بالفعل.";
    }
    if (error.code === "auth/weak-password") {
      return "كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.";
    }
    if (error.code === "permission-denied") {
      return "تعذر حفظ حساب الميسر. تأكد من صلاحيات المشرف العام في Firestore.";
    }
  }

  return "تعذر إنشاء حساب الميسر. حاول مرة أخرى بعد قليل.";
}
