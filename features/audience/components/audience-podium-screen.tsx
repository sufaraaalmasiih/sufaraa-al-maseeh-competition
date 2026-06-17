"use client";



import { useMemo } from "react";

import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/layout/empty-state";

import { ErrorState, LoadingState } from "@/components/layout/state-view";

import { CompetitionPodium } from "@/components/competition/competition-podium";

import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";

import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";

import { refreshTeamStatesSubscription } from "@/features/gameflow/team-states-store";

import { useFinalResults } from "@/features/facilitator/use-final-results";



export function AudiencePodiumScreen() {

  const { teams, loading, error } = useFinalResults();



  const topThree = useMemo(

    () =>

      [...teams]

        .sort((first, second) => first.rank - second.rank)

        .slice(0, 3),

    [teams],

  );



  if (loading) {

    return <LoadingState variant="page" />;

  }



  if (error) {

    return (

      <div className="space-y-4">

        <ErrorState title="تعذر تحميل المنصة" description={error} />

        <div className="text-center">

          <Button type="button" variant="outline" onClick={() => refreshTeamStatesSubscription()}>

            إعادة المحاولة

          </Button>

        </div>

      </div>

    );

  }



  return (

    <AudienceStageResultsGate

      resetKey="podium"

      eyebrow="منصة التكريم"

      countdownTitle="استعدوا لإعلان الفائزين"

      countdownSubtitle="سيُكشف عن أفضل ثلاثة فرق خلال لحظات"

    >

      {(resultsReady) => (

        <AudienceStageScreenCard

          badge="منصة الفائزين"

          title="مبارك للفائزين!"

          subtitle="أفضل ثلاثة فرق في المسابقة"

          screenClassName="competition-stage-screen--podium audience-podium-screen"

        >

          {topThree.length === 0 ? (

            <EmptyState title="بانتظار النتائج النهائية" />

          ) : (

            <CompetitionPodium

              showHeader={false}

              animate={resultsReady}

              showGovernorate

              teams={topThree.map((team) => ({

                teamId: team.teamId,

                teamName: team.teamName,

                score: team.total,

                governorate: team.governorate,

              }))}

            />

          )}

        </AudienceStageScreenCard>

      )}

    </AudienceStageResultsGate>

  );

}

