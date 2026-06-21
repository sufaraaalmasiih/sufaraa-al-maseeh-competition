"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { FacilitatorControlsConfirmCard } from "@/features/facilitator/components/facilitator-controls-confirm-card";
import { FacilitatorControlsGlobalLocksPanel } from "@/features/facilitator/components/facilitator-controls-global-locks-panel";
import { FacilitatorControlsSessionLogPanel } from "@/features/facilitator/components/facilitator-controls-session-log-panel";
import { FacilitatorControlsScoreEditPanel } from "@/features/facilitator/components/facilitator-controls-score-edit-panel";
import { FacilitatorControlsTeamActionsPanel } from "@/features/facilitator/components/facilitator-controls-team-actions-panel";
import { FacilitatorControlsTeamPicker } from "@/features/facilitator/components/facilitator-controls-team-picker";
import { FacilitatorObjectionsPanel } from "@/features/facilitator/components/facilitator-objections-panel";
import { TeamArchivePanel } from "@/features/facilitator/components/team-archive-panel";
import { useFacilitatorControlsTab } from "@/features/facilitator/components/use-facilitator-controls-tab";

export function FacilitatorControlsTab() {
  const controls = useFacilitatorControlsTab();

  if (controls.loading) {
    return <LoadingState variant="page" />;
  }

  if (controls.error) {
    return <ErrorState title="تعذر تحميل الفرق" description={controls.error} />;
  }

  if (controls.teams.length === 0) {
    return <EmptyState title="لا توجد فرق مسجلة حتى الآن." />;
  }

  return (
    <div className="space-y-6">
      {controls.toast ? (
        <p className="facilitator-controls-toast facilitator-inline-success">{controls.toast}</p>
      ) : null}

      <FacilitatorObjectionsPanel />

      <FacilitatorControlsTeamPicker
        teams={controls.teams}
        selectedTeamId={controls.selectedTeamId}
        onSelectedTeamIdChange={controls.setSelectedTeamId}
      />

      {!controls.selectedTeamId ? (
        <FacilitatorControlsGlobalLocksPanel
          activeLocks={controls.globalLocks}
          globalLocksMixed={controls.globalLocksMixed}
          globalLocksLoading={controls.globalLocksLoading}
          confirmRequest={controls.confirmRequest}
          onToggleLock={controls.requestToggleLock}
        />
      ) : null}

      {controls.selectedTeam ? (
        <>
          <FacilitatorControlsTeamActionsPanel
            selectedTeamName={controls.selectedTeam.teamName}
            override={controls.override}
            overrideStatusKey={controls.overrideStatusKey}
            onOverrideStatusKeyChange={controls.setOverrideStatusKey}
            overrideQuestionScope={controls.overrideQuestionScope}
            overrideQuestionNumber={controls.overrideQuestionNumber}
            onOverrideQuestionNumberChange={controls.setOverrideQuestionNumber}
            overrideQuestionValidation={controls.overrideQuestionValidation}
            selectedOverrideOption={controls.selectedOverrideOption}
            overrideStage3QuestionId={controls.overrideStage3QuestionId}
            onOverrideStage3QuestionIdChange={controls.setOverrideStage3QuestionId}
            stageLocks={controls.stageLocks}
            answerFilter={controls.answerFilter}
            onAnswerFilterChange={controls.setAnswerFilter}
            showAnswers={controls.showAnswers}
            onShowAnswersChange={controls.setShowAnswers}
            filteredAnswers={controls.filteredAnswers}
            answersLoading={controls.answersLoading}
            confirmRequest={controls.confirmRequest}
            onApplyOverride={controls.requestApplyOverride}
            onClearOverride={controls.requestClearOverride}
            onResetTimer={controls.requestResetTeamTimer}
            onToggleLock={controls.requestToggleLock}
            onDeleteAnswers={controls.requestDeleteAnswers}
            onResetTeamData={controls.requestResetTeamData}
            onRemoveTeamFromCompetition={controls.requestRemoveTeamFromCompetition}
          />

          <FacilitatorControlsScoreEditPanel
            teamName={controls.selectedTeam.teamName}
            currentScores={controls.currentScores}
            values={controls.scoreInputs}
            onValuesChange={controls.setScoreInputs}
            onResetToAutomatic={controls.resetScoreInputsToAutomatic}
            onSave={controls.requestSaveScores}
            disabled={controls.confirmRequest !== null}
          />

          <TeamArchivePanel
            teamId={controls.selectedTeam.teamId}
            teamName={controls.selectedTeam.teamName}
          />
        </>
      ) : null}

      {controls.confirmRequest ? (
        <FacilitatorControlsConfirmCard
          request={controls.confirmRequest}
          onClose={controls.closeConfirm}
        />
      ) : null}

      <FacilitatorControlsSessionLogPanel
        showEditLog={controls.showEditLog}
        onShowEditLogChange={controls.setShowEditLog}
        editLogEntries={controls.editLogEntries}
        editLogLoading={controls.editLogLoading}
        editLogError={controls.editLogError}
      />
    </div>
  );
}
