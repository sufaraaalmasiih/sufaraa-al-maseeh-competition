# Stage 1 Test Checklist

This checklist verifies Sprint 2 Stage 1 only. Do not use real production accounts during this test.

## Preparation

1. Start the app with `npm run dev`.
2. Open `/dev/create-admin-user` in development and create a facilitator or super_admin account if one is not available.
3. Open `/register` in a separate browser or incognito window and create at least two test teams.
4. Confirm Firestore contains:
   - `teams/{uid}` for each team.
   - `competitions/main/teamStates/{uid}` for each team.
   - No `users/{uid}` document for team accounts.

## Start Stage 1 Intro

1. Log in through `/facilitator-login`.
2. Open `/facilitator`.
3. In `سير المسابقة`, click `شرح المرحلة الأولى`.
4. Expected result:
   - `competitions/main/system/gameFlow.status` is `stage1_intro`.
   - Team screen `/team` shows the Stage 1 intro placeholder.
   - Audience screen remains synchronized with the public placeholder.

## Start Stage 1 Running

1. In `/facilitator`, click `بدء المرحلة الأولى`.
2. Expected result:
   - `gameFlow.status` is `stage1_running`.
   - `currentStage` is `stage1`.
   - Team screen renders the Stage 1 mock question UI.
   - Audience screen renders Stage 1 ranking.

## Start Timer

1. In `/facilitator`, click `Start Stage 1 Timer`.
2. Expected result:
   - `competitions/main/system/timer.active` is `true`.
   - `stage` is `stage1`.
   - Team, facilitator, and audience screens show the same countdown.

## Answer Questions

1. On `/team`, select an answer.
2. Confirm the answer.
3. Expected result:
   - The selected option stays highlighted.
   - `تم تأكيد الإجابة` appears.
   - The screen advances automatically after a short delay.
   - No `السؤال التالي` button is required.

## Verify Firestore Answer

1. Check `competitions/main/answers/stage1_{questionId}_{teamId}`.
2. Expected fields:
   - `teamId`
   - `teamName`
   - `stage: "stage1"`
   - `questionId`
   - `questionIndex`
   - `questionText`
   - `answer`
   - `confirmed: true`
   - `isCorrect`
   - `pointsDelta`
   - `confirmedAt`
   - `createdAt`
   - `updatedAt`

## Verify Score

1. Check `competitions/main/teamStates/{teamId}`.
2. Expected result for correct answer:
   - `stageScores.stage1` increases by `5`.
   - `totalScore` increases by `5`.
   - `progress.stage1QuestionIndex` moves forward.
3. Expected result for wrong answer:
   - `stageScores.stage1` does not increase.
   - `totalScore` does not increase.
   - `progress.stage1QuestionIndex` still moves forward.

## Verify Duplicate Scoring Prevention

1. Refresh `/team`.
2. Confirm the same already answered mock question again if the UI restarts from it.
3. Expected result:
   - Existing answer is reused.
   - Score is not added a second time.

## Verify Ranking

1. Keep `/facilitator` and `/audience` open.
2. Confirm correct and wrong answers from team screens.
3. Expected result:
   - Facilitator Stage 1 ranking updates in realtime.
   - Audience ranking updates in realtime.
   - Ranking sorts by Stage 1 score, then total score, then team name.

## Verify Timer Expiry

1. Let the Stage 1 timer expire, or set the test timer to an expired value in development.
2. Attempt to confirm an answer.
3. Expected result:
   - Answer options and confirmation are blocked.
   - Team screen shows `انتهى وقت المرحلة، بانتظار توجيه الميسر`.
   - No answer document is saved after expiry.

## Finish Stage 1

1. In `/facilitator`, click `إنهاء المرحلة الأولى`.
2. Expected result:
   - `gameFlow.status` is `stage1_finished`.
   - Timer is stopped.
   - Team screen shows `أحسنتم!` and the team Stage 1 score.
   - Audience screen shows `نتائج مرحلة اجمعوا الكنوز`.
   - No podium or final results are shown.

Stage 1 Frozen v1 approved after Sprint 2.7.
