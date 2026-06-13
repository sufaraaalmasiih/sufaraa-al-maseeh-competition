# Stage 2 Test Checklist

This checklist verifies Stage 2 (`فتشوا الكتب`) through Sprint 3.12. Do not use real production accounts during this test.

## Preparation

1. Start the app with `npm run dev`.
2. Create a facilitator account through `/dev/create-admin-user` or `/facilitator-login`.
3. Create at least two test teams through `/register` in separate browsers or incognito windows.
4. Verify Firestore contains:
   - `teams/{uid}` for each team.
   - `competitions/main/teamStates/{uid}` for each team.
5. Verify `stage2Roles` are empty and `locked: false` before role assignment begins.

## Role Assignment

1. In `/facilitator`, set `gameFlow.status` to `stage2_role_assignment`.
2. On `/team`, assign all four field players (matching, arrangeVerse, completeVerse, trueFalseCorrect).
3. Lock roles.
4. Expected result:
   - `competitions/main/teamStates/{teamId}.stage2Roles.locked` is `true`.
   - All four player names are saved.
   - Refresh `/team` and confirm roles remain locked.

## Reading Phase

1. In `/facilitator`, set status to `stage2_reading`.
2. Click `Start Stage 2 Reading Timer`.
3. Expected result:
   - `competitions/main/system/timer.active` is `true`.
   - `stage` is `stage2`.
   - `purpose` is `reading`.
   - Duration is 180 seconds.
4. Open `/team`, `/audience`, and `/facilitator` and verify the same countdown appears on all three screens.

## Matching

1. Set `gameFlow.status` to `stage2_player_turns`.
2. Set team progress to the matching field (`progress.stage2Field = matching`, `stage2FieldIndex = 0`).
3. Answer one correct matching question on `/team`.
4. Expected result:
   - Firestore doc at `competitions/main/answers/stage2_matching_{questionId}_{teamId}`.
   - `pointsDelta: 15`.
   - `stageScores.stage2` increases by 15.
   - `totalScore` increases by 15.
   - `progress.stage2QuestionIndex` increments.
5. Refresh and confirm the same answer again.
6. Expected result:
   - No duplicate score added.

## Arrange Verse

1. Move to arrangeVerse field (`progress.stage2Field = arrangeVerse`, `stage2FieldIndex = 1`).
2. Answer one correct arrangeVerse question.
3. Expected result:
   - Firestore doc at `competitions/main/answers/stage2_arrangeVerse_{questionId}_{teamId}`.
   - `pointsDelta: 15`.
   - Score increases by 15.
4. Confirm duplicate answer does not add score again.

## Complete Verse

1. Move to completeVerse field (`progress.stage2Field = completeVerse`, `stage2FieldIndex = 2`).
2. Answer one correct completeVerse question.
3. Expected result:
   - Firestore doc at `competitions/main/answers/stage2_completeVerse_{questionId}_{teamId}`.
   - `pointsDelta: 15`.
   - Score increases by 15.
4. Confirm duplicate answer does not add score again.

## True/False

1. Move to trueFalseCorrect field (`progress.stage2Field = trueFalseCorrect`, `stage2FieldIndex = 3`).
2. Answer one correct **صح** question.
3. Answer one correct **خطأ** question with correction text.
4. Expected result:
   - Firestore doc at `competitions/main/answers/stage2_trueFalseCorrect_{questionId}_{teamId}`.
   - `correctionText` stored when **خطأ** is selected.
   - `expectedCorrection` stored from mock question for facilitator review.
   - `pointsDelta: 15` when صح/خطأ choice is correct.
5. Select **خطأ** without correction text and attempt confirm.
6. Expected result:
   - Validation blocks confirmation (`اكتب التصحيح أولاً`).
7. Confirm duplicate answer does not add score again.

## Timer Guard

1. Start Stage 2 answering timer (`stage: stage2`, `purpose: answering`) or wait for expiry.
2. Attempt to confirm an answer on `/team`.
3. Expected result:
   - Interaction blocked with `انتهى وقت الإجابة، بانتظار توجيه الميسر`.
   - No new answer document saved after expiry.

## Ranking

1. Ensure at least two teams have different `stageScores.stage2` values.
2. Set `gameFlow.status` to `stage2_finished`.
3. Expected result:
   - `/facilitator` shows **نتائج مرحلة فتشوا الكتب** ranking table.
   - `/audience` shows Stage 2 ranked cards.
   - Ranking order: `stageScores.stage2` desc → `totalScore` desc → `teamName` asc.

## Finish Flow

1. From `stage2_player_turns`, in `/facilitator` click **إنهاء المرحلة الثانية**.
2. Expected result:
   - `gameFlow.status` is `stage2_finished`.
   - `gameFlow.currentStage` is `stage2`.
   - `competitions/main/system/timer.active` is `false`.
   - `/team` shows **أحسنتم!** with Stage 2 score and total score.
   - `/audience` shows **نتائج مرحلة فتشوا الكتب**.
   - `/facilitator` shows Stage 2 ranking table.
   - No automatic advance to Stage 3 or final results.

Stage 2 Frozen v1 approved after Sprint 3.12.
