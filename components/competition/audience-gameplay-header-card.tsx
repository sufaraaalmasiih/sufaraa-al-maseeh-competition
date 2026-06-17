"use client";



import { BrandLogoMark } from "@/components/competition/brand-logo-mark";

import { GameplayHeaderTimer } from "@/components/competition/gameplay-header-timer";

import { getCompetitionStageLabel } from "@/features/team/competition-stage-labels";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

import { useGameplayHeaderTimer } from "@/features/gameflow/use-gameplay-header-timer";

import { useGameFlow } from "@/features/gameflow/use-game-flow";

import { cn } from "@/lib/utils";



export function AudienceGameplayHeaderCard() {

  const { status } = useGameFlow();

  const content = useCompetitionContent();

  const stageLabel = getCompetitionStageLabel(status, content);

  const headerTimer = useGameplayHeaderTimer(status);



  return (

    <header

      className={cn(

        "gameplay-unified-header",

        headerTimer && "gameplay-unified-header--has-timer",

      )}

    >

      <div className="gameplay-unified-header__side gameplay-unified-header__side--start">

        <div className="gameplay-header-identity">

          <BrandLogoMark className="gameplay-unified-competition-logo" size="lg" />

          <div className="gameplay-unified-brand">

            <p className="gameplay-unified-title">سفراء المسيح</p>

            <p className="gameplay-unified-slogan">نحيا بالكلمة... ونشهد للحق</p>

          </div>

        </div>

      </div>



      <div className="gameplay-unified-header__center">

        {headerTimer ? (

          <GameplayHeaderTimer

            label={headerTimer.label}

            remainingSeconds={headerTimer.remainingSeconds}

            durationSeconds={headerTimer.durationSeconds}

            isExpired={headerTimer.isExpired}

            paused={headerTimer.paused}

          />

        ) : (

          <p className="gameplay-unified-stage gameplay-unified-stage--center">{stageLabel}</p>

        )}

      </div>



      <div className="gameplay-unified-header__side gameplay-unified-header__side--end">

        <div className="gameplay-header-meta gameplay-header-meta--audience">

          <p className="gameplay-unified-stage">شاشة الجمهور</p>

        </div>

      </div>

    </header>

  );

}

