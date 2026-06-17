"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { FacilitatorControlsConfirmCard } from "@/features/facilitator/components/facilitator-controls-confirm-card";
import { FacilitatorControlsGlobalLocksPanel } from "@/features/facilitator/components/facilitator-controls-global-locks-panel";
import { FacilitatorControlsSessionLogPanel } from "@/features/facilitator/components/facilitator-controls-session-log-panel";
import { FacilitatorControlsTeamActionsPanel } from "@/features/facilitator/components/facilitator-controls-team-actions-panel";
import { FacilitatorControlsTeamPicker } from "@/features/facilitator/components/facilitator-controls-team-picker";
import { FacilitatorControlsTeamProfilePanel } from "@/features/facilitator/components/facilitator-controls-team-profile-panel";
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
          <FacilitatorControlsTeamProfilePanel
            profileLoading={controls.profileLoading}
            adminLoading={controls.adminLoading}
            profileError={controls.profileError}
            teamName={controls.teamName}
            onTeamNameChange={controls.setTeamName}
            governorate={controls.governorate}
            onGovernorateChange={controls.setGovernorate}
            accountEmail={controls.accountEmail}
            onAccountEmailChange={controls.setAccountEmail}
            accountPassword={controls.accountPassword}
            onAccountPasswordChange={controls.setAccountPassword}
            playerNames={controls.playerNames}
            onPlayerNamesChange={controls.setPlayerNames}
            confirmRequest={controls.confirmRequest}
            onSaveProfile={controls.requestSaveProfile}
          />

          <FacilitatorControlsTeamActionsPanel
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
            onToggleLock={controls.requestToggleLock}
            onDeleteAnswers={controls.requestDeleteAnswers}
            onResetTeamData={controls.requestResetTeamData}
            onDeleteTeamCompletely={controls.requestDeleteTeamCompletely}
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
