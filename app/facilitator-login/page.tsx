import { LoginForm } from "@/features/auth/components/login-form";

export default function FacilitatorLoginPage() {
  return (
    <LoginForm
      allowedRoles={["facilitator"]}
      title="دخول الميسر"
      description="هذه الصفحة مخصصة لحسابات الميسر فقط. المشرف العام يدخل من «دخول المشرف العام»."
      switchHref="/login"
      switchLabel="العودة إلى بوابة الدخول"
      roleErrorMessage="هذا الحساب ليس حساب ميسر. استخدم بوابة المشرف العام إن كنت مشرفاً عاماً."
    />
  );
}
