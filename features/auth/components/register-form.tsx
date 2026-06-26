"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { stampCompetitionReauthEpoch } from "@/features/competition-session/competition-session-controls";
import { registerTeam, TeamStateCreateError } from "@/firebase/auth";
import { primeAuthRole } from "@/hooks/use-auth-role";
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
    watch,
    formState: { errors },
  } = useForm<RegisterTeamInput>({
    resolver: zodResolver(registerTeamSchema),
  });
  const selectedLogo = watch("logo");
  const selectedLogoFile = selectedLogo?.[0] ?? null;
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLogoFile) {
      setLogoPreviewUrl(null);
      setLogoStatus(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedLogoFile);
    setLogoPreviewUrl(previewUrl);
    setLogoStatus("تمت إضافة الصورة إلى النموذج. ستُرفع عند إنشاء الفريق.");

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedLogoFile]);

  async function onSubmit(values: RegisterTeamInput) {
    setFormError(null);
    setIsRegistering(true);
    if (values.logo?.[0]) {
      setLogoStatus("جارٍ رفع شعار الفريق...");
    }
    try {
      const { uid, logoUploadFailed } = await registerTeam(values);
      if (logoUploadFailed) {
        console.warn("Team registration continued without the optional logo.");
        setLogoStatus("تم إنشاء الفريق، لكن تعذر رفع الشعار. يمكن إضافته لاحقاً من الإدارة.");
      } else if (values.logo?.[0]) {
        setLogoStatus("اكتمل رفع شعار الفريق بنجاح.");
      }
      // We just wrote teams/{uid}; seed the role so the AuthGate on /team does
      // not race the not-yet-propagated doc and show "ليست لديك صلاحية" (#5).
      primeAuthRole(uid, "team");
      await stampCompetitionReauthEpoch();
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
      variant="form-wide"
    >
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <FieldError message={formError} />
        <div className="responsive-grid-2">
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

        <div className="responsive-grid-2">
          {playerFields.map(([name, label]) => (
            <FormField key={name} label={label} error={errors[name]?.message}>
              <Input {...register(name)} />
            </FormField>
          ))}
        </div>

        <FormField label="شعار الفريق (اختياري)" error={errors.logo?.message}>
          <Input type="file" accept="image/*" {...register("logo")} />
          {selectedLogoFile ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
              {logoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="معاينة شعار الفريق"
                  className="h-14 w-14 shrink-0 rounded-full border border-white bg-white object-cover"
                  src={logoPreviewUrl}
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#143A5A]">
                  {selectedLogoFile.name}
                </p>
                {logoStatus ? (
                  <p className="text-xs font-semibold text-[#1E40AF]">{logoStatus}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </FormField>

        <Button className="auth-form__submit" size="lg" disabled={isRegistering}>
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
