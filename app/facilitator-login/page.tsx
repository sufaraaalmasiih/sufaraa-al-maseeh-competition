import { LoginForm } from "@/features/auth/components/login-form";

export default function FacilitatorLoginPage() {
  return (
    <LoginForm
      allowedRoles={["facilitator", "super_admin"]}
      title="دخول الميسر"
      description="للميسّر والمشرف العام — تشغيل المسابقة وإدارة المراحل."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
      roleErrorMessage="هذا الحساب ليس حساب ميسّر أو مشرف عام."
    />
  );
}
