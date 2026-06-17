import { CreateAdminUserForm } from "@/features/auth/components/create-admin-user-form";
import { AuthLayout } from "@/features/auth/components/auth-layout";

export default function CreateAdminUserPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <AuthLayout
        title="غير متاح"
        description="هذه الصفحة متاحة في بيئة التطوير فقط"
        switchHref="/login"
        switchLabel="العودة إلى بوابة الدخول"
        variant="form"
      >
        <p className="text-center text-base font-bold text-[#143A5A]">
          هذه الصفحة متاحة في بيئة التطوير فقط
        </p>
      </AuthLayout>
    );
  }

  return <CreateAdminUserForm />;
}
