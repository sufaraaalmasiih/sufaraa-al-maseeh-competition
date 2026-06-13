"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerTeam, TeamStateCreateError } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import {
  registerTeamSchema,
  type RegisterTeamInput,
} from "@/features/auth/schemas";

const playerFields = [
  ["player1", "اللاعب 1"] as const,
  ["player2", "اللاعب 2"] as const,
  ["player3", "اللاعب 3"] as const,
  ["player4", "اللاعب 4"] as const,
  ["player5", "اللاعب 5 (البديل)"] as const,
];

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterTeamInput>({
    resolver: zodResolver(registerTeamSchema),
  });

  async function onSubmit(values: RegisterTeamInput) {
    setFormError(null);
    setIsRegistering(true);
    try {
      const { logoUploadFailed } = await registerTeam(values);
      if (logoUploadFailed) {
        console.warn("Team registration continued without the optional logo.");
      }
      router.push("/team");
    } catch (error) {
      setFormError(getRegistrationErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <AuthLayout
      title="تسجيل فريق"
      description="أنشئ حساب الفريق الأساسي للمشاركة في المسابقة."
      switchHref="/team-login"
      switchLabel="لديك حساب بالفعل؟ تسجيل الدخول"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldError message={formError} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="اسم الفريق" error={errors.teamName?.message}>
            <Input {...register("teamName")} />
          </FormField>
          <FormField label="المحافظة" error={errors.governorate?.message}>
            <Input {...register("governorate")} />
          </FormField>
          <FormField label="البريد الإلكتروني" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField label="كلمة المرور" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {playerFields.map(([name, label]) => (
            <FormField key={name} label={label} error={errors[name]?.message}>
              <Input {...register(name)} />
            </FormField>
          ))}
        </div>

        <FormField label="شعار الفريق (اختياري)" error={errors.logo?.message}>
          <Input type="file" accept="image/*" {...register("logo")} />
        </FormField>

        <Button className="w-full" size="lg" disabled={isRegistering}>
          <UserPlus className="h-5 w-5" />
          {isRegistering ? "جاري إنشاء الفريق..." : "إنشاء الفريق"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function getRegistrationErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "هذا البريد الإلكتروني مستخدم بالفعل. يمكنك تسجيل الدخول إلى حساب الفريق.";
    }
    if (error.code === "auth/weak-password") {
      return "كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.";
    }
    if (error.code === "auth/invalid-email") {
      return "البريد الإلكتروني غير صحيح. يرجى مراجعته والمحاولة مرة أخرى.";
    }
    if (error.code === "auth/network-request-failed") {
      return "تعذر الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مرة أخرى.";
    }
    if (error.code === "permission-denied") {
      return "تعذر حفظ بيانات الفريق بسبب صلاحيات قاعدة البيانات. يرجى مراجعة إعدادات Firestore.";
    }
    if (error.code === "unavailable") {
      return "خدمة قاعدة البيانات غير متاحة الآن. يرجى المحاولة مرة أخرى بعد قليل.";
    }
  }

  if (error instanceof TeamStateCreateError) {
    return "تم إنشاء حساب الفريق، لكن تعذر تجهيز حالة الفريق داخل المسابقة. يرجى إبلاغ الميسر والمحاولة مرة أخرى.";
  }

  return "تعذر إنشاء الفريق. يرجى المحاولة مرة أخرى بعد قليل.";
}

function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null;
}
