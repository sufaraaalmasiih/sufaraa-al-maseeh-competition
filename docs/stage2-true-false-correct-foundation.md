# Stage 2 True/False With Correction Foundation

## Scope

Sprint 3.9 built the **trueFalseCorrect (صح أو خطأ مع تصحيح)** field question UI foundation.

Sprint 3.10 adds Firestore answer persistence and +15 scoring (mirrors matching / arrangeVerse / completeVerse answer engines).

Reference passage: **يوحنا 15: 1-17**

## Mock questions (5)

| # | Statement | Correct | Expected correction |
|---|-----------|---------|---------------------|
| 1 | قال يسوع: أنا الكرمة الحقيقية وأبي الكرام. | صح | — |
| 2 | قال يسوع: بدوني تقدرون أن تصنعوا كثيراً. | خطأ | بدوني لا تقدرون أن تصنعوا شيئاً |
| 3 | قال يسوع: أنا الكرمة وأنتم الأغصان. | صح | — |
| 4 | قال يسوع: من لا يثبت فيّ يثمر كثيراً. | خطأ | من يثبت فيّ و أنا فيه يثمر كثيراً |
| 5 | قال يسوع: إن لم يثبت أحد فيَّ يُطرح خارجاً كالغصن. | صح | — |

Source: `features/stage2/stage2-true-false-correct-mock-questions.ts`

## Selection and correction behavior

Each question presents:

- A statement from John 15
- Two choices: **صح** or **خطأ**
- If **خطأ** is selected → textarea appears with label **اكتب التصحيح**

Player flow:

1. Select **صح** or **خطأ** (blue highlight when selected).
2. If **خطأ**, enter correction text.
3. Tap **تأكيد الإجابة**.
4. Validation:
   - No selection → **اختر صح أو خطأ أولاً**
   - **خطأ** with empty correction → **اكتب التصحيح أولاً**
5. Firestore transaction saves answer and applies scoring.
6. After confirmation → answer locks, **تم تأكيد الإجابة**, auto-advance after 850ms.
7. After question 5 → **انتهت أسئلة صح أو خطأ التجريبية، بانتظار توجيه الميسر**.

## Scoring (Sprint 3.10)

Correctness is based **only** on choosing **صح** or **خطأ** correctly:

- **صح** is correct when `question.correctIsTrue === true`
- **خطأ** is correct when `question.correctIsTrue === false`

Correction text is stored for facilitator review but **not strictly graded yet**.

- Correct choice: **+15** (`pointsDelta: 15`)
- Wrong choice: **0** (no penalty)
- Updates `stageScores.stage2` and `totalScore` transactionally
- Updates `progress.stage2QuestionIndex` to `questionIndex + 1`
- Does **not** update `progress.stage2FieldIndex`

## Firestore answer path (Sprint 3.10)

`competitions/main/answers/stage2_trueFalseCorrect_{questionId}_{teamId}`

Example: `stage2_trueFalseCorrect_stage2-true-false-correct-1_{teamId}`

Document fields:

- `teamId`, `teamName`
- `stage: "stage2"`, `field: "trueFalseCorrect"`
- `questionId`, `questionIndex`, `questionText` (statement)
- `answer` (**صح** or **خطأ**)
- `correctionText` (player text when **خطأ**, otherwise `""`)
- `expectedCorrection` (from mock question for review, or `""`)
- `confirmed: true`, `confirmedAt`
- `isCorrect`, `pointsDelta`
- `createdAt`, `updatedAt`

## Duplicate scoring prevention (Sprint 3.10)

If an answer document already exists with `confirmed: true`:

- No additional points are applied
- Existing result is returned
- UI may continue to the next question without duplicate score

## Field progression (unchanged from Sprint 3.2)

- True/False questions do **not** advance `progress.stage2FieldIndex`.
- **إنهاء هذا المجال التجريبي** still moves progress via the Sprint 3.2 finish flow.
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

## Runtime error prevention

Confirm handlers use explicit wrappers (no React click events passed to async Firestore logic):

- `onClick={() => handleConfirmClick()}`
- `onConfirm={() => { void confirmTrueFalseCorrectAnswer().catch(...) }}`
- Choice and correction text validated as string / enum before save

## Facilitator display

Existing `Stage2ProgressTable` reflects:

- `stageScores.stage2`
- `totalScore`
- `progress.stage2QuestionIndex`

No ranking changes in this sprint.

## Runtime test checklist

1. Lock `stage2Roles` and set `gameFlow.status = stage2_player_turns`.
2. Set `progress.stage2Field = trueFalseCorrect`, `stage2FieldIndex = 3`, `stage2QuestionIndex = 0`.
3. Answer correct **صح** or **خطأ** → verify Firestore doc and +15 scoring.
4. Refresh and re-confirm same question → no duplicate score.
5. Answer wrong choice → 0 points, `stage2QuestionIndex` still increments.
6. Select **خطأ** without correction → validation blocks confirm.
7. Add correction and confirm → `correctionText` saved in answer doc.
8. No `[object Event]` runtime error on confirm.
9. Matching, arrangeVerse, and completeVerse still work unchanged.

## Intentionally not implemented

- Strict correction-text grading
- Stage 2 ranking
- Excel import
- Stage 3 / Stage 4
- Automatic field progression after question 5

## Key files

| File | Role |
|------|------|
| `features/stage2/stage2-true-false-correct-types.ts` | Question/answer types |
| `features/stage2/stage2-true-false-correct-mock-questions.ts` | 5 mock questions |
| `features/stage2/confirm-stage2-true-false-correct-answer.ts` | Firestore transaction |
| `features/stage2/components/stage2-true-false-correct-question-card.tsx` | Single question UI |
| `features/stage2/components/stage2-true-false-correct-field-screen.tsx` | 5-question flow |
| `features/stage2/components/stage2-player-turns-screen.tsx` | Routes trueFalseCorrect field |

## Stage 1 freeze

Stage 1 logic is unchanged per `docs/stage1-freeze-v1.md`.
