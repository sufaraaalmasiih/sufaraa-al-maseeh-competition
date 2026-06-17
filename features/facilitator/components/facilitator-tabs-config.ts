import {
  Archive,
  BookOpen,
  Info,
  Monitor,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type FacilitatorTabValue =
  | "flow"
  | "controls"
  | "results"
  | "history"
  | "questions"
  | "audience"
  | "about"
  | "settings"
  | "admin";

export interface FacilitatorTabConfig {
  value: FacilitatorTabValue;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  primary?: boolean;
}

export const FACILITATOR_TABS: FacilitatorTabConfig[] = [
  { value: "flow", label: "سير المسابقة", shortLabel: "السير", icon: Radio, primary: true },
  { value: "controls", label: "التحكم", shortLabel: "التحكم", icon: SlidersHorizontal, primary: true },
  { value: "results", label: "النتائج", shortLabel: "النتائج", icon: Trophy, primary: true },
  { value: "audience", label: "شاشة الجمهور", shortLabel: "الجمهور", icon: Monitor, primary: true },
  { value: "history", label: "السجل", shortLabel: "السجل", icon: Archive },
  { value: "questions", label: "بنك الأسئلة", shortLabel: "الأسئلة", icon: BookOpen },
  { value: "about", label: "عن المسابقة", shortLabel: "عن المسابقة", icon: Info },
  { value: "settings", label: "الإعدادات", shortLabel: "الإعدادات", icon: Settings },
];

export const FACILITATOR_SUPER_ADMIN_TAB: FacilitatorTabConfig = {
  value: "admin",
  label: "إدارة النظام",
  shortLabel: "الإدارة",
  icon: ShieldCheck,
};

const FACILITATOR_TAB_VALUES = new Set<FacilitatorTabValue>(
  FACILITATOR_TABS.map((tab) => tab.value),
);

export function resolveFacilitatorDefaultTab(
  role: string | null | undefined,
  tabParam: string | null,
): FacilitatorTabValue {
  if (role === "super_admin" && tabParam === "admin") {
    return "admin";
  }

  if (tabParam && FACILITATOR_TAB_VALUES.has(tabParam as FacilitatorTabValue)) {
    return tabParam as FacilitatorTabValue;
  }

  return "flow";
}
