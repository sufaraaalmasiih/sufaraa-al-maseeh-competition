"use client";

import {
  BarChart3,
  Eye,
  LayoutDashboard,
  ShieldCheck,
  ShieldPlus,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { AuthPortalTile } from "@/features/auth/components/auth-portal-tile";

interface PortalLink {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "audience" | "dev";
  prefetch?: boolean;
  spanFull?: boolean;
}

interface PortalSection {
  title: string;
  links: PortalLink[];
}

const portalSections: PortalSection[] = [
  {
    title: "الفرق",
    links: [
      {
        href: "/team-login",
        label: "دخول الفرق",
        hint: "للاعبين المسجّلين مسبقاً",
        icon: UsersRound,
        prefetch: true,
      },
      {
        href: "/register",
        label: "تسجيل فريق جديد",
        hint: "إنشاء حساب فريق للمشاركة",
        icon: UserPlus,
        prefetch: true,
      },
      {
        href: "/coach-login",
        label: "دخول المدرب",
        hint: "متابعة النقاط — للعرض فقط (لا يلعب)",
        icon: BarChart3,
        prefetch: true,
      },
      {
        href: "/coach-register",
        label: "تسجيل مدرب جديد",
        hint: "حساب مدرب منفصل مرتبط بفريق",
        icon: UserPlus,
        prefetch: true,
      },
    ],
  },
  {
    title: "التشغيل",
    links: [
      {
        href: "/facilitator-login",
        label: "دخول الميسر",
        hint: "تشغيل المسابقة وإدارة المراحل",
        icon: LayoutDashboard,
        prefetch: true,
      },
      {
        href: "/admin-login",
        label: "دخول المشرف العام",
        hint: "تشغيل المسابقة + تبويب إدارة النظام",
        icon: ShieldCheck,
        prefetch: true,
      },
    ],
  },
  {
    title: "العرض",
    links: [
      {
        href: "/audience",
        label: "شاشة الجمهور",
        hint: "عرض عام — لا يحتاج تسجيل دخول",
        icon: Eye,
        tone: "audience",
        prefetch: false,
        spanFull: true,
      },
    ],
  },
];

const devSection: PortalSection = {
  title: "بيئة التطوير",
  links: [
    {
      href: "/dev/create-admin-user",
      label: "إنشاء حساب إدارة (تطوير)",
      hint: "أداة محلية لتهيئة أول حساب مشرف — غير متاحة في الإنتاج",
      icon: ShieldPlus,
      tone: "dev",
      prefetch: false,
      spanFull: true,
    },
  ],
};

export function AccessPortal() {
  const sections =
    process.env.NODE_ENV === "development"
      ? [...portalSections, devSection]
      : portalSections;

  return (
    <AuthLayout
      variant="hub"
      title="بوابة الدخول"
      description="اختر المسار المناسب لدورك في مسابقة سفراء المسيح."
    >
      <div className="auth-portal-grid">
        {sections.map((section) => (
          <div key={section.title} className="auth-portal-section">
            <h3 className="auth-portal-section__title">{section.title}</h3>
            <div className="auth-portal-section__tiles">
              {section.links.map((link) => (
                <AuthPortalTile key={link.href} {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AuthLayout>
  );
}
