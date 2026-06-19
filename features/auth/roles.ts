import type { AppRole } from "@/types";

export type StaffRole = Exclude<AppRole, "team" | "coach">;

export const ROLE_LABELS: Record<AppRole, string> = {
  team: "فريق",
  coach: "مدرب",
  facilitator: "ميسر",
  super_admin: "مشرف عام",
  viewer: "جمهور (حساب)",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  facilitator:
    "تشغيل المسابقة يومياً: سير المراحل، المؤقت، بنك الأسئلة، شاشة الجمهور، ومتابعة الفرق.",
  super_admin:
    "إدارة النظام: كل صلاحيات الميسر + إنشاء حسابات الميسر، إعادة التعيين، وبدء مسابقة جديدة.",
  viewer: "حساب تجريبي للجمهور — الشاشة العامة متاحة بدون تسجيل دخول.",
};

export type PermissionKey =
  | "run_competition"
  | "manage_question_bank"
  | "manage_teams"
  | "manage_audience_display"
  | "edit_competition_content"
  | "competition_reset"
  | "start_new_competition"
  | "create_facilitator_accounts"
  | "manage_staff_accounts";

const PERMISSION_MATRIX: Record<PermissionKey, readonly AppRole[]> = {
  run_competition: ["facilitator", "super_admin"],
  manage_question_bank: ["facilitator", "super_admin"],
  manage_teams: ["facilitator", "super_admin"],
  manage_audience_display: ["facilitator", "super_admin"],
  edit_competition_content: ["facilitator", "super_admin"],
  competition_reset: ["super_admin"],
  start_new_competition: ["super_admin"],
  create_facilitator_accounts: ["super_admin"],
  manage_staff_accounts: ["super_admin"],
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  run_competition: "تشغيل سير المسابقة والمراحل",
  manage_question_bank: "إدارة بنك الأسئلة والأرشيف",
  manage_teams: "متابعة الفرق وتعديل بياناتها",
  manage_audience_display: "التحكم بشاشة الجمهور",
  edit_competition_content: "تحرير نصوص «عن المسابقة»",
  competition_reset: "إعادة تعيين المسابقة",
  start_new_competition: "بدء مسابقة جديدة وإخراج الفرق",
  create_facilitator_accounts: "إنشاء حسابات الميسر",
  manage_staff_accounts: "إدارة حسابات التشغيل",
};

export function roleHasPermission(role: AppRole, permission: PermissionKey): boolean {
  return PERMISSION_MATRIX[permission].includes(role);
}

export function getPermissionsForRole(role: AppRole): PermissionKey[] {
  return (Object.keys(PERMISSION_MATRIX) as PermissionKey[]).filter((key) =>
    roleHasPermission(role, key),
  );
}

export const FACILITATOR_PERMISSIONS = getPermissionsForRole("facilitator");
export const SUPER_ADMIN_PERMISSIONS = getPermissionsForRole("super_admin");
