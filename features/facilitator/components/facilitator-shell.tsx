"use client";

import {
  Archive,
  BookOpen,
  Info,
  Monitor,
  Radio,
  Settings,
  SlidersHorizontal,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { FacilitatorAboutTab } from "@/features/facilitator/components/facilitator-about-tab";
import { FacilitatorAudienceTab } from "@/features/facilitator/components/facilitator-audience-tab";
import { FacilitatorControlsTab } from "@/features/facilitator/components/facilitator-controls-tab";
import { FacilitatorFlowPanel } from "@/features/facilitator/components/facilitator-flow-panel";
import { FacilitatorResultsTab } from "@/features/facilitator/components/facilitator-results-tab";
import { FacilitatorHistoryTab } from "@/features/facilitator/components/facilitator-history-tab";
import { FacilitatorQuestionBankTab } from "@/features/facilitator/components/facilitator-question-bank-tab";
import { FacilitatorSettingsTab } from "@/features/facilitator/components/facilitator-settings-tab";
import { FacilitatorStage3Automation } from "@/features/facilitator/components/facilitator-stage3-automation";
import { FacilitatorStage4Automation } from "@/features/facilitator/components/facilitator-stage4-automation";
import { FacilitatorStage12Automation } from "@/features/facilitator/components/facilitator-stage12-automation";
import { cn } from "@/lib/utils";

type FacilitatorTabValue =
  | "flow"
  | "controls"
  | "results"
  | "history"
  | "questions"
  | "audience"
  | "about"
  | "settings";

interface FacilitatorTab {
  value: FacilitatorTabValue;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  primary?: boolean;
}

const FACILITATOR_TABS: FacilitatorTab[] = [
  { value: "flow", label: "سير المسابقة", shortLabel: "السير", icon: Radio, primary: true },
  { value: "controls", label: "التحكم", shortLabel: "التحكم", icon: SlidersHorizontal, primary: true },
  { value: "results", label: "النتائج", shortLabel: "النتائج", icon: Trophy, primary: true },
  { value: "audience", label: "شاشة الجمهور", shortLabel: "الجمهور", icon: Monitor, primary: true },
  { value: "history", label: "السجل", shortLabel: "السجل", icon: Archive },
  { value: "questions", label: "بنك الأسئلة", shortLabel: "الأسئلة", icon: BookOpen },
  { value: "about", label: "عن المسابقة", shortLabel: "عن المسابقة", icon: Info },
  { value: "settings", label: "الإعدادات", shortLabel: "الإعدادات", icon: Settings },
];

export function FacilitatorShell() {
  return (
    <AuthGate
      allowedRoles={["facilitator", "super_admin"]}
      directAccessMessage="لوحة الميسر جاهزة للوصول المباشر. سجّل الدخول بحساب الميسر أو المشرف العام للمتابعة."
    >
      <main className="page-shell facilitator-console">
        <div className="facilitator-console__ambient" aria-hidden />
        <div className="content-shell facilitator-console__inner">
          <AppHeader title="لوحة الميسر" />
          <FacilitatorStage3Automation />
          <FacilitatorStage4Automation />
          <FacilitatorStage12Automation />
          <Tabs defaultValue="flow" dir="rtl" className="facilitator-shell-tabs">
            <TabsList
              className="facilitator-dock !h-auto !min-h-0 !w-full !flex-nowrap !justify-start !gap-1 !rounded-2xl !bg-transparent !p-2"
              aria-label="أقسام لوحة الميسر"
            >
              {FACILITATOR_TABS.map((tab, index) => {
                const Icon = tab.icon;
                const isFirstSecondary =
                  !tab.primary && FACILITATOR_TABS[index - 1]?.primary;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "facilitator-dock__item !h-auto !rounded-xl !px-0 !py-0 !text-inherit !shadow-none data-[state=active]:!bg-transparent data-[state=active]:!text-inherit data-[state=active]:!shadow-none",
                      tab.primary && "facilitator-dock__item--primary",
                      isFirstSecondary && "facilitator-dock__item--secondary-start",
                    )}
                    title={tab.label}
                  >
                    <Icon className="facilitator-dock__icon" aria-hidden />
                    <span className="facilitator-dock__label">{tab.shortLabel}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="flow" className="facilitator-shell-tabs__panel">
              <FacilitatorFlowPanel />
            </TabsContent>
            <TabsContent value="controls" className="facilitator-shell-tabs__panel">
              <FacilitatorControlsTab />
            </TabsContent>
            <TabsContent value="results" className="facilitator-shell-tabs__panel">
              <FacilitatorResultsTab />
            </TabsContent>
            <TabsContent value="history" className="facilitator-shell-tabs__panel">
              <FacilitatorHistoryTab />
            </TabsContent>
            <TabsContent value="questions" className="facilitator-shell-tabs__panel">
              <FacilitatorQuestionBankTab />
            </TabsContent>
            <TabsContent value="audience" className="facilitator-shell-tabs__panel">
              <FacilitatorAudienceTab />
            </TabsContent>
            <TabsContent value="about" className="facilitator-shell-tabs__panel">
              <FacilitatorAboutTab />
            </TabsContent>
            <TabsContent value="settings" className="facilitator-shell-tabs__panel">
              <FacilitatorSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AuthGate>
  );
}
