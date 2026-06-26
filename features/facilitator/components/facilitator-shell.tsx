"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { LoadingState } from "@/components/layout/state-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { useCompetitionContentSync } from "@/features/competition-content/competition-content-runtime";
import { useQuestionBankRuntimeSync } from "@/features/facilitator/question-bank-runtime";
import { useFacilitatorTeamLogoSync } from "@/features/facilitator/use-facilitator-team-logo-sync";
import { FacilitatorAboutTab } from "@/features/facilitator/components/facilitator-about-tab";
import { FacilitatorAdminTab } from "@/features/facilitator/components/facilitator-admin-tab";
import { FacilitatorAudienceTab } from "@/features/facilitator/components/facilitator-audience-tab";
import { FacilitatorControlsTab } from "@/features/facilitator/components/facilitator-controls-tab";
import { FacilitatorFlowPanel } from "@/features/facilitator/components/facilitator-flow-panel";
import { FacilitatorSettingsTab } from "@/features/facilitator/components/facilitator-settings-tab";
import { SoundToggleButton } from "@/features/competition/components/sound-toggle-button";
import { useCompetitionSoundCues } from "@/features/competition/use-competition-sound-cues";
import { useGameFlow } from "@/features/gameflow/use-game-flow";

const FacilitatorQuestionBankTab = dynamic(
  () =>
    import("@/features/facilitator/components/facilitator-question-bank-tab").then(
      (module) => module.FacilitatorQuestionBankTab,
    ),
  { loading: () => <LoadingState variant="inline" /> },
);

const FacilitatorHistoryTab = dynamic(
  () =>
    import("@/features/facilitator/components/facilitator-history-tab").then(
      (module) => module.FacilitatorHistoryTab,
    ),
  { loading: () => <LoadingState variant="inline" /> },
);

const FacilitatorResultsTab = dynamic(
  () =>
    import("@/features/facilitator/components/facilitator-results-tab").then(
      (module) => module.FacilitatorResultsTab,
    ),
  { loading: () => <LoadingState variant="inline" /> },
);
import { FacilitatorStage12Automation } from "@/features/facilitator/components/facilitator-stage12-automation";
import { FacilitatorStage3Automation } from "@/features/facilitator/components/facilitator-stage3-automation";
import { FacilitatorStage4Automation } from "@/features/facilitator/components/facilitator-stage4-automation";
import { FacilitatorTopToastBanner } from "@/features/facilitator/components/facilitator-top-toast-banner";
import { TrainingModeCleanup } from "@/features/facilitator/components/training-mode-cleanup";
import {
  FACILITATOR_SUPER_ADMIN_TAB,
  FACILITATOR_TABS,
  resolveFacilitatorDefaultTab,
  type FacilitatorTabValue,
} from "@/features/facilitator/components/facilitator-tabs-config";
import { useAuthRole } from "@/hooks/use-auth-role";
import { cn } from "@/lib/utils";

/** Always mounted — audience display must be ready on first tab click. */
const EAGER_FACILITATOR_TAB_PANELS = new Set<FacilitatorTabValue>(["flow", "audience"]);

const FACILITATOR_TAB_PANELS: Array<{
  value: FacilitatorTabValue;
  render: () => ReactNode;
}> = [
  { value: "flow", render: () => <FacilitatorFlowPanel /> },
  { value: "controls", render: () => <FacilitatorControlsTab /> },
  { value: "results", render: () => <FacilitatorResultsTab /> },
  { value: "history", render: () => <FacilitatorHistoryTab /> },
  { value: "questions", render: () => <FacilitatorQuestionBankTab /> },
  { value: "audience", render: () => <FacilitatorAudienceTab /> },
  { value: "about", render: () => <FacilitatorAboutTab /> },
  { value: "settings", render: () => <FacilitatorSettingsTab /> },
  { value: "admin", render: () => <FacilitatorAdminTab /> },
];

export function FacilitatorShell() {
  return (
    <AuthGate
      allowedRoles={["facilitator", "super_admin"]}
      directAccessMessage="لوحة الميسر جاهزة للوصول المباشر. سجّل الدخول بحساب الميسر أو المشرف العام للمتابعة."
    >
      <FacilitatorShellAuthenticated />
    </AuthGate>
  );
}

function FacilitatorShellAuthenticated() {
  useCompetitionContentSync();
  useQuestionBankRuntimeSync();
  const { status, objectionAcceptedNotice } = useGameFlow();
  useCompetitionSoundCues(status, true, objectionAcceptedNotice?.key ?? null);

  const { role } = useAuthRole();
  const searchParams = useSearchParams();
  const isSuperAdmin = role === "super_admin";
  // مزامنة شعارات الفرق إلى teamStates العامة لتظهر لكل الشاشات.
  useFacilitatorTeamLogoSync(role === "facilitator" || role === "super_admin");
  const tabs = isSuperAdmin ? [...FACILITATOR_TABS, FACILITATOR_SUPER_ADMIN_TAB] : FACILITATOR_TABS;
  const defaultTab = resolveFacilitatorDefaultTab(role, searchParams.get("tab"));
  const headerTitle = isSuperAdmin ? "لوحة المشرف العام" : "لوحة الميسر";
  const visiblePanels = FACILITATOR_TAB_PANELS.filter(
    (panel) => panel.value !== "admin" || isSuperAdmin,
  );
  const [activeTab, setActiveTab] = useState<FacilitatorTabValue>(defaultTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<FacilitatorTabValue>>(
    () => new Set<FacilitatorTabValue>([defaultTab, "audience"]),
  );

  const markTabVisited = (tab: string) => {
    const value = tab as FacilitatorTabValue;
    setActiveTab(value);
    setVisitedTabs((current) => {
      if (current.has(value)) {
        return current;
      }
      const next = new Set(current);
      next.add(value);
      return next;
    });
  };

  const mountedPanels = useMemo(
    () =>
      visiblePanels.filter(
        (panel) => EAGER_FACILITATOR_TAB_PANELS.has(panel.value) || visitedTabs.has(panel.value),
      ),
    [visiblePanels, visitedTabs],
  );

  return (
    <main className="page-shell facilitator-console">
        <FacilitatorTopToastBanner />
        <SoundToggleButton />
        <div className="facilitator-console__ambient" aria-hidden />
        <div className="content-shell facilitator-console__inner">
          <AppHeader title={headerTitle} />

          {/* Must stay mounted across tab switches — timers/automation depend on it. */}
          <FacilitatorStage3Automation />
          <FacilitatorStage4Automation />
          <FacilitatorStage12Automation />
          <TrainingModeCleanup />

          <Tabs value={activeTab} onValueChange={markTabVisited} dir="rtl" className="facilitator-shell-tabs">
            <TabsList
              className="facilitator-dock !h-auto !min-h-0 !w-full !flex-nowrap !justify-start !gap-1 !rounded-2xl !bg-transparent !p-2"
              aria-label={isSuperAdmin ? "أقسام لوحة المشرف العام" : "أقسام لوحة الميسر"}
            >
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isFirstSecondary = !tab.primary && tabs[index - 1]?.primary;

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

            {mountedPanels.map((panel) => (
              <TabsContent key={panel.value} value={panel.value} className="facilitator-shell-tabs__panel">
                {panel.render()}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
  );
}
