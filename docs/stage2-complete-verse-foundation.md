# Stage 2 Complete Verse Foundation

## Scope

Sprint 3.7 built the **completeVerse (أكمل الآيات)** field question UI foundation.

Sprint 3.8 adds Firestore answer persistence and +15 scoring (mirrors matching / arrangeVerse answer engines).

Reference passage: **يوحنا 15: 1-17**

## Mock questions (5)

| # | Verse with blank | Correct answer |
|---|------------------|----------------|
| 1 | أنا الكرمة وأنتم ____ | الأغصان |
| 2 | أنا الكرمة الحقيقية و____ الكرام | أبي |
| 3 | من يثبت فيّ و____ فيه يثمر كثيراً | أنا |
| 4 | إن لم ____ أحد فيَّ يُطرح خارجاً كالغصن | يثبت |
| 5 | لأن ____ لا تقدرون أن تصنعوا شيئاً | بدوني |

Source: `features/stage2/stage2-complete-verse-mock-questions.ts`

## Selection mechanism

Each question presents:

- Prompt: **أكمل الآية التالية**
- Verse with blank (`verseWithBlank`)
- Four options
- One correct option

Player flow:

1. Select one option (blue highlight when selected).
2. Tap **تأكيد الإجابة**.
3. If no option selected → **اختر إجابة أولاً**.
4. Firestore transaction saves answer and applies scoring.
5. After confirmation → answer locks, **تم تأكيد الإجابة**, auto-advance after 850ms.
6. After question 5 → **انتهت أسئلة إكمال الآيات التجريبية، سيتم الانتقال إلى المجال التالي لاحقاً**.

## Firestore answer path (Sprint 3.8)

`competitions/main/answers/stage2_completeVerse_{questionId}_{teamId}`

Example: `stage2_completeVerse_stage2-complete-verse-1_{teamId}`

Document fields:

- `teamId`, `teamName`
- `stage: "stage2"`, `field: "completeVerse"`
- `questionId`, `questionIndex`, `questionText`
- `answer` (selected option text)
- `confirmed: true`, `confirmedAt`
- `isCorrect`, `pointsDelta`
- `createdAt`, `updatedAt`

## Scoring (Sprint 3.8)

- Correct answer: **+15** (`pointsDelta: 15`)
- Wrong answer: **0** (no penalty)
- Updates `stageScores.stage2` and `totalScore` transactionally
- Updates `progress.stage2QuestionIndex` to `questionIndex + 1`
- Does **not** update `progress.stage2FieldIndex`

## Duplicate scoring prevention (Sprint 3.8)

If an answer document already exists with `confirmed: true`:

- No additional points are applied
- Existing result is returned
- UI may continue to the next question without duplicate score

## Field progression (unchanged from Sprint 3.2)

- Complete Verse questions do **not** advance `progress.stage2FieldIndex`.
- **إنهاء هذا المجال التجريبي** still moves to the next field via Firestore progress update.
- `progress.stage2QuestionIndex` resets to `0` when entering this field (Sprint 3.6.1).

## Timer behavior

If `competitions/main/system/timer` is active with:

- `stage: "stage2"`
- `purpose: "answering"`
- expired

Then selection and confirmation are blocked with:

**انتهى وقت الإجابة، بانتظار توجيه الميسر**

The transaction also rejects confirmation when the timer is expired or `gameFlow.status !== "stage2_player_turns"`.

## Firestore failure

On save failure the UI shows:

**تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.**

The screen does not advance and the user may retry.

## Runtime test checklist

1. Lock `stage2Roles` and set `gameFlow.status = stage2_player_turns`.
2. Set `progress.stage2Field = completeVerse`, `stage2FieldIndex = 2`, `stage2QuestionIndex = 0`.
3. Team sees question 1 — select option → confirm.
4. Verify Firestore doc at `answers/stage2_completeVerse_{questionId}_{teamId}`.
5. Correct answer → `stageScores.stage2` +15, `totalScore` +15, `stage2QuestionIndex` incremented.
6. Wrong answer → 0 points, `stage2QuestionIndex` still incremented.
7. Auto-advance through all 5 questions; completion message appears after Q5.
8. Re-confirm same question → no duplicate score (duplicate prevention).
9. Expired Stage 2 answering timer → blocked with **انتهى وقت الإجابة، بانتظار توجيه الميسر**.
10. Matching and arrangeVerse fields still work unchanged.

## Intentionally not implemented

- Stage 2 ranking
- `trueFalseCorrect` question UI
- Excel import
- Stage 3 / Stage 4
- Automatic field progression after completeVerse questions complete

## Key files

| File | Role |
|------|------|
| `features/stage2/stage2-complete-verse-types.ts` | Question/answer types |
| `features/stage2/stage2-complete-verse-mock-questions.ts` | 5 mock questions |
| `features/stage2/confirm-stage2-complete-verse-answer.ts` | Firestore transaction |
| `features/stage2/components/stage2-complete-verse-question-card.tsx` | Single question UI |
| `features/stage2/components/stage2-complete-verse-field-screen.tsx` | 5-question flow |
| `features/stage2/components/stage2-player-turns-screen.tsx` | Routes completeVerse field |

## Stage 1 freeze

Stage 1 logic is unchanged per `docs/stage1-freeze-v1.md`.
