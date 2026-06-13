import { LoginForm } from "@/features/auth/components/login-form";

export default function TeamLoginPage() {
  return (
    <LoginForm
      allowedRoles={["team"]}
      title="دخول الفرق"
      description="سجّل دخول الفريق للوصول إلى شاشة المشاركة."
      switchHref="/register"
      switchLabel="تسجيل فريق جديد"
      roleErrorMessage="هذا الحساب ليس حساب فريق. يرجى استخدام بوابة الدخول المناسبة."
    />
  );
}
