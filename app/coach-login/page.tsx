import { LoginForm } from "@/features/auth/components/login-form";

export default function CoachLoginPage() {
  return (
    <LoginForm
      allowedRoles={["coach"]}
      title="دخول المدرب"
      description="سجّل الدخول بحساب المدرب المرتبط بفريقك (للعرض فقط — لا يمكنه اللعب)."
      switchHref="/coach-register"
      switchLabel="إنشاء حساب مدرب جديد"
      roleErrorMessage="هذا الحساب ليس حساب مدرب. استخدم بوابة الدخول المناسبة."
    />
  );
}
