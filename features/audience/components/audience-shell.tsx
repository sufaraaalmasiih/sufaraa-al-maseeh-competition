"use client";

import { AppHeader } from "@/components/layout/app-header";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { AudienceStage2Finished } from "@/features/audience/components/audience-stage2-finished";
import { AudienceStage1Finished } from "@/features/audience/components/audience-stage1-finished";
import { AudienceStage1Running } from "@/features/audience/components/audience-stage1-running";
import { AudienceStage2Reading } from "@/features/audience/components/audience-stage2-reading";
import { isStage3Status } from "@/features/stage3/stage3-constants";
import { Stage3AudienceRevealScreen } from "@/features/stage3/components/stage3-audience-reveal-screen";
import { Stage3AudienceBoardScreen } from "@/features/stage3/components/stage3-audience-board-screen";
import { Stage3AudienceWaitingScreen } from "@/features/stage3/components/stage3-audience-waiting-screen";
import { Stage3FinishedScreen } from "@/features/stage3/components/stage3-finished-screen";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { Stage3AudiencePlaceholder } from "@/features/stage3/components/stage3-audience-placeholder";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import { isStage4Status } from "@/features/stage4/stage4-constants";
import { Stage4AudienceQuestionScreen } from "@/features/stage4/components/stage4-audience-question-screen";
import { Stage4AudienceRevealScreen } from "@/features/stage4/components/stage4-audience-reveal-screen";
import { Stage4FinishedScreen } from "@/features/stage4/components/stage4-finished-screen";
import { Stage4WaitingScreen } from "@/features/stage4/components/stage4-waiting-screen";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { AudienceCompetitionIntroScreen } from "@/features/audience/components/audience-competition-intro-screen";
import { Stage1IntroScreen } from "@/features/stage1/components/stage1-intro-screen";
import { GameFlowPlaceholder } from "@/features/gameflow/components/gameflow-placeholder";
import { audienceGameFlowLabels } from "@/features/gameflow/gameflow-copy";
import { useGameFlow } from "@/features/gameflow/use-game-flow";

export function AudienceShell() {
  const {
    status,
    stage3ActiveQuestion,
    stage3OpenedQuestionIds,
    stage3OwnerTeamName,
    stage3UsedQuestionIds,
    stage3SelectionTimeoutNotice,
    stage4QuestionIndex,
    stage4QuestionCount,
    loading,
    error,
  } = useGameFlow();
  const {
    teams: stage3Teams,
    loading: stage3RankingLoading,
    error: stage3RankingError,
  } = useStage3Ranking();

  return (
    <CompetitionGradientShell centerContent={false} contentClassName="content-shell px-4 py-8">
        <AppHeader title="شاشة الجمهور" variant="gradient" />
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState title="تعذر تحميل سير المسابقة" description={error} /> : null}
        {!loading && !error && status === "competition_intro" ? (
          <AudienceCompetitionIntroScreen />
        ) : null}
        {!loading && !error && status === "stage1_intro" ? (
          <Stage1IntroScreen />
        ) : null}
        {!loading && !error && status === "stage1_running" ? (
          <AudienceStage1Running />
        ) : null}
        {!loading && !error && status === "stage1_finished" ? (
          <AudienceStage1Finished />
        ) : null}
        {!loading && !error && status === "stage2_reading" ? (
          <AudienceStage2Reading />
        ) : null}
        {!loading && !error && status === "stage2_finished" ? (
          <AudienceStage2Finished />
        ) : null}
        {!loading && !error && status === "stage3_board" ? (
          <>
            <Stage3AudienceBoardScreen
              openedQuestionIds={stage3OpenedQuestionIds}
              usedQuestionIds={stage3UsedQuestionIds}
              ownerTeamName={stage3OwnerTeamName}
              selectionTimeoutNotice={stage3SelectionTimeoutNotice}
            />
            <Stage3RankingTable
              teams={stage3Teams}
              loading={stage3RankingLoading}
              error={stage3RankingError}
              variant="audience"
            />
          </>
        ) : null}
        {!loading && !error && status === "stage3_question_open" ? (
          <Stage3QuestionOpenScreen
            question={stage3ActiveQuestion}
            ownerTeamName={stage3OwnerTeamName}
            variant="audience"
          />
        ) : null}
        {!loading && !error && status === "stage3_answer_closed" ? (
          <Stage3AudienceWaitingScreen
            variant="answer_closed"
            question={stage3ActiveQuestion}
            ownerTeamName={stage3OwnerTeamName}
          />
        ) : null}
        {!loading && !error && status === "stage3_reveal" ? (
          <>
            <Stage3AudienceRevealScreen
              question={stage3ActiveQuestion}
              ownerTeamName={stage3OwnerTeamName}
            />
            <Stage3RankingTable
              teams={stage3Teams}
              loading={stage3RankingLoading}
              error={stage3RankingError}
              variant="audience"
            />
          </>
        ) : null}
        {!loading && !error && status === "stage3_results_done" ? (
          <Stage3AudienceWaitingScreen
            variant="results_done"
            question={stage3ActiveQuestion}
            ownerTeamName={stage3OwnerTeamName}
          />
        ) : null}
        {!loading && !error && status === "stage3_finished" ? (
          <Stage3FinishedScreen variant="audience" />
        ) : null}
        {!loading && !error && status === "stage4_intro" ? (
          <div className="glass-card-premium p-8 text-center">
            <p className="text-xs font-bold text-[#2388C4]">{STAGE4_NAME}</p>
            <h2 className="mt-2 text-2xl font-black text-[#143A5A]">المرحلة الرابعة</h2>
          </div>
        ) : null}
        {!loading && !error && status === "stage4_waiting_question" ? (
          <Stage4WaitingScreen
            questionIndex={stage4QuestionIndex}
            questionCount={stage4QuestionCount}
            variant="audience"
          />
        ) : null}
        {!loading && !error && status === "stage4_question_open" ? (
          <Stage4AudienceQuestionScreen />
        ) : null}
        {!loading && !error && status === "stage4_answers_closed" ? (
          <div className="glass-card-premium p-8 text-center">
            <p className="text-lg font-black text-[#143A5A]">بانتظار الإعلان</p>
          </div>
        ) : null}
        {!loading && !error && status === "stage4_reveal" ? (
          <Stage4AudienceRevealScreen />
        ) : null}
        {!loading && !error && status === "stage4_finished" ? (
          <Stage4FinishedScreen variant="audience" />
        ) : null}
        {!loading &&
        !error &&
        status &&
        isStage3Status(status) &&
        status !== "stage3_board" &&
        status !== "stage3_question_open" &&
        status !== "stage3_answer_closed" &&
        status !== "stage3_reveal" &&
        status !== "stage3_results_done" &&
        status !== "stage3_finished" ? (
          <Stage3AudiencePlaceholder status={status} />
        ) : null}
        {!loading &&
        !error &&
        status &&
        status !== "stage1_running" &&
        status !== "stage1_finished" &&
        status !== "stage2_reading" &&
        status !== "stage2_finished" &&
        status !== "competition_intro" &&
        status !== "stage1_intro" &&
        !isStage3Status(status) &&
        !(status && isStage4Status(status)) ? (
          <GameFlowPlaceholder
            title={audienceGameFlowLabels[status]}
            description="عرض جمهور تأسيسي متزامن مع سير المسابقة فقط."
          />
        ) : null}
    </CompetitionGradientShell>
  );
}
