import Link from "next/link";
import { Eye, LayoutDashboard, ShieldCheck, ShieldPlus, UserPlus, UsersRound } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/auth-layout";

const portalLinks = [
  {
    href: "/team-login",
    label: "دخول الفرق",
    icon: UsersRound,
  },
  {
    href: "/register",
    label: "تسجيل فريق جديد",
    icon: UserPlus,
  },
  {
    href: "/facilitator-login",
    label: "دخول الميسر",
    icon: LayoutDashboard,
  },
  {
    href: "/admin-login",
    label: "دخول المشرف العام",
    icon: ShieldCheck,
  },
  {
    href: "/audience",
    label: "شاشة الجمهور",
    icon: Eye,
  },
] as const;

export function AccessPortal() {
  const links =
    process.env.NODE_ENV === "development"
      ? [
          ...portalLinks,
          {
            href: "/dev/create-admin-user",
            label: "إنشاء حساب إدارة (تطوير)",
            icon: ShieldPlus,
          },
        ]
      : portalLinks;

  return (
    <AuthLayout
      title="بوابة الدخول"
      description="اختر المسار المناسب لدورك في مسابقة سفراء المسيح."
    >
      <div className="grid gap-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            className="flex min-h-12 items-center justify-center gap-3 rounded-md border border-primary/15 bg-[#F3FAFF] px-4 py-3 text-base font-bold text-[#143A5A] transition-colors hover:border-primary/35 hover:bg-[#E9F6FC]"
            href={href}
          >
            <Icon className="h-5 w-5 text-primary" />
            {label}
          </Link>
        ))}
      </div>
    </AuthLayout>
  );
}
