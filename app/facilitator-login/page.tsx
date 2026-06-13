import { LoginForm } from "@/features/auth/components/login-form";

export default function FacilitatorLoginPage() {
  return (
    <LoginForm
      allowedRoles={["facilitator", "super_admin"]}
      title="دخول الميسر"
      description="هذه الصفحة مخصصة لحسابات الميسر والمشرف العام."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
      roleErrorMessage="هذا الحساب لا يملك صلاحية الميسر."
    />
  );
}
