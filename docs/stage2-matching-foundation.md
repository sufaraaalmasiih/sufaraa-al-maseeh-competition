# Stage 2 Matching Foundation

## Scope

Sprint 3.3–3.4 builds the **matching (توصيل)** field question UI and answer engine.

Reference passage: **يوحنا 15: 1-17**

## Mock questions (5)

| # | Prompt | Correct answer |
|---|--------|----------------|
| 1 | أكمل التوصيل الصحيح: أنا الكرمة الحقيقية و... | أبي الكرام |
| 2 | أكمل التوصيل الصحيح: أنتم الأغصان وأنا... | الكرمة |
| 3 | أكمل التوصيل الصحيح: من يثبت فيّ وأنا فيه يثمر... | كثيراً |
| 4 | أكمل التوصيل الصحيح: إن لم يثبت أحد فيَّ يُطرح خارجاً ك... | الغصن |
| 5 | أكمل التوصيل الصحيح: لأن بدوني لا تقدرون أن... | تصنعوا شيئاً |

Source: `features/stage2/stage2-matching-mock-questions.ts`

## Simplified matching behavior

Each question presents:

- A prompt (completion-style matching)
- A left phrase (`leftItem`) for context
- Three options
- One correct option

Player flow:

1. Assigned player receives the device on the matching field.
2. Select one option (blue highlight when selected).
3. Tap **تأكيد الإجابة**.
4. If no option selected → **اختر إجابة أولاً**.
5. After confirmation → answer locks, **تم تأكيد الإجابة**, auto-advance after 850ms.
6. After question 5 → **انتهت أسئلة التوصيل التجريبية، سيتم الانتقال إلى المجال التالي لاحقاً**.

## Answer documents (Sprint 3.4)

Path: `competitions/main/answers/{answerId}`

Answer ID format: `stage2_matching_{questionId}_{teamId}`

Fields written on confirm:

- `teamId`, `teamName`, `stage: "stage2"`, `field: "matching"`
- `questionId`, `questionIndex`, `questionText`, `answer`
- `confirmed: true`, `confirmedAt`, `isCorrect`, `pointsDelta`
- `createdAt`, `updatedAt`

## Scoring (Sprint 3.4)

- Correct answer: **+15** (`pointsDelta: 15`)
- Wrong answer: **0** (no penalty)
- Updates `stageScores.stage2` and `totalScore` transactionally
- Updates `progress.stage2QuestionIndex` to `questionIndex + 1`
- Does **not** update `progress.stage2FieldIndex`

## Duplicate scoring prevention (Sprint 3.4)

If an answer document already exists with `confirmed: true`:

- No additional points are applied
- Existing result is returned
- UI may continue to the next question without duplicate score

## Field progression (unchanged from Sprint 3.2)

- Matching questions do **not** advance `progress.stage2FieldIndex`.
- **إنهاء هذا المجال التجريبي** still moves to the next field via Firestore progress update.

## Timer behavior

If `competitions/main/system/timer` is active with:

- `stage: "stage2"`
- `purpose: "answering"`
- expired

Then selection and confirmation are blocked with:

**انتهى وقت الإجابة، بانتظار توجيه الميسر**

If no Stage 2 answering timer is active, matching questions work normally for testing.

## Firestore failure

On save failure the UI shows:

**تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.**

The screen does not advance and the user may retry.

## Intentionally not implemented

- Stage 2 ranking
- `arrangeVerse`, `completeVerse`, `trueFalseCorrect` question UI
- Excel import
- Stage 3 / Stage 4
- Automatic field progression after matching questions complete

## Key files

| File | Role |
|------|------|
| `features/stage2/stage2-matching-types.ts` | Question/answer types |
| `features/stage2/stage2-matching-mock-questions.ts` | 5 mock questions |
| `features/stage2/confirm-stage2-matching-answer.ts` | Firestore transaction |
| `features/stage2/components/stage2-matching-question-card.tsx` | Single question UI |
| `features/stage2/components/stage2-matching-field-screen.tsx` | 5-question flow |
| `features/stage2/components/stage2-player-turns-screen.tsx` | Routes matching vs other fields |
| `features/stage2/components/stage2-progress-table.tsx` | Facilitator read-only progress |

## Stage 1 freeze

Stage 1 logic is unchanged per `docs/stage1-freeze-v1.md`.
