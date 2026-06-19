"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  InvalidLoginCredentialError,
  loginWithEmail,
  getUserRole,
  logout,
} from "@/firebase/auth";
import { stampCompetitionReauthEpoch } from "@/features/competition-session/competition-session-controls";
import { ensureTeamStateDoc } from "@/lib/ensure-team-profile";
import { getClientFirebaseAuth, isFirebaseClientConfigured } from "@/firebase/firebaseClient";
import { mapFirebaseAuthError } from "@/lib/map-firebase-auth-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { roleRoutes, type AppRole } from "@/types";

interface LoginFormProps {
  allowedRoles: AppRole[];
  title: string;
  description: string;
  switchHref?: string;
  switchLabel?: string;
  roleErrorMessage: string;
}

export function LoginForm({
  allowedRoles,
  title,
  description,
  switchHref,
  switchLabel,
  roleErrorMessage,
}: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    if (!isFirebaseClientConfigured()) {
      setFormError(
        "إعداد Firebase غير مكتمل على الاستضافة. تحقق من متغيرات NEXT_PUBLIC_FIREBASE_* في Vercel ثم أعد النشر.",
      );
      return;
    }
    try {
      const credential = await loginWithEmail(values.email, values.password);
      const role = await getUserRole(credential.user.uid);
      if (!role) {
        await logout();
        setFormError("لا يوجد ملف مستخدم مرتبط بهذا الحساب");
        return;
      }
      if (!allowedRoles.includes(role)) {
        await logout();
        setFormError(roleErrorMessage);
        return;
      }
      if (role === "team") {
        // يعود الفريق للمشاركة بعد «بدء مسابقة جديدة» أو «الإخراج» بإعادة إنشاء حالته.
        try {
          await ensureTeamStateDoc(credential.user.uid);
        } catch {
          // غير حرج — يمكن إعادة المحاولة لاحقاً.
        }
        await stampCompetitionReauthEpoch();
      }
      await getClientFirebaseAuth().authStateReady();
      router.push(roleRoutes[role]);
    } catch (error) {
      if (error instanceof InvalidLoginCredentialError) {
        setFormError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }
      const mapped = mapFirebaseAuthError(error);
      if (mapped) {
        setFormError(mapped);
        return;
      }
      setFormError("تعذر تسجيل الدخول. حاول مرة أخرى بعد قليل.");
    }
  }

  return (
    <AuthLayout
      title={title}
      description={description}
      switchHref={switchHref}
      switchLabel={switchLabel}
      variant="form"
    >
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <FieldError message={formError} />
        <div className="auth-form__field">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="auth-form__field">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <Button className="auth-form__submit" size="lg" disabled={isSubmitting}>
          <LogIn className="h-5 w-5" />
          {isSubmitting ? "جاري الدخول..." : "دخول"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null;
}
