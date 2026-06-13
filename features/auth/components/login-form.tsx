"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  InvalidLoginCredentialError,
  loginWithEmail,
  getUserRole,
} from "@/firebase/auth";
import { getClientFirebaseAuth } from "@/firebase/firebaseClient";
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
    try {
      const credential = await loginWithEmail(values.email, values.password);
      const role = await getUserRole(credential.user.uid);
      if (!role) {
        setFormError("لا يوجد ملف مستخدم مرتبط بهذا الحساب");
        return;
      }
      if (!allowedRoles.includes(role)) {
        setFormError(roleErrorMessage);
        return;
      }
      await getClientFirebaseAuth().authStateReady();
      router.push(roleRoutes[role]);
    } catch (error) {
      if (error instanceof InvalidLoginCredentialError) {
        setFormError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }
      if (error instanceof FirebaseError && error.code === "auth/network-request-failed") {
        setFormError("تعذر الاتصال بخدمة المصادقة. تحقق من الإنترنت ثم حاول مرة أخرى.");
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
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldError message={formError} />
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <Button className="w-full" size="lg" disabled={isSubmitting}>
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
