import { LoginForm } from "@/features/auth/components/login-form";

export default function AdminLoginPage() {
  return (
    <LoginForm
      allowedRoles={["super_admin"]}
      title="دخول المشرف العام"
      description="هذه الصفحة مخصصة لحساب المشرف العام فقط."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
      roleErrorMessage="هذا الحساب لا يملك صلاحية المشرف العام."
    />
  );
}
