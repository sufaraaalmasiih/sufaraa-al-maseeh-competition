# Stage 2 Arrange Verse Foundation

## Scope

Sprint 3.5–3.6 builds the **arrangeVerse (رتّب الآية أو الآيات)** field question UI and answer engine.

Reference passage: **يوحنا 15: 1-17**

## Mock questions (5)

| # | Correct order |
|---|---------------|
| 1 | أنا الكرمة الحقيقية → وأبي الكرام |
| 2 | أنا الكرمة → وأما أنتم → فأنتم الأغصان |
| 3 | إن لم يثبت أحد فيّ → يُجف → كالغصن |
| 4 | إن ثبتم فيّ → وثبت كلامي فيكم → فاطلبوا ما تريدون |
| 5 | لم تختارونني → أنا اخترتكم → وتأتي أيضاً ثمراً |

Source: `features/stage2/stage2-arrange-verse-mock-questions.ts`

Each question stores:

- `fragments[]` — shuffled starting order shown to the player
- `correctOrder[]` — canonical order used for scoring

## Ordering mechanism

Players see shuffled fragments and reorder them using **up/down buttons** on each row.

Before confirmation:

- Current order is visible with numbered rows
- Order is editable via move-up / move-down controls
- Player must reorder at least once before confirming
- Invalid confirm shows: **رتب الآية أولاً**

After confirmation:

- Order locks
- **تم تأكيد الإجابة**
- Auto-advance after 850ms
- After question 5: **انتهت أسئلة ترتيب الآيات التجريبية، سيتم الانتقال إلى المجال التالي لاحقاً**

## Answer documents (Sprint 3.6)

Path: `competitions/main/answers/{answerId}`

Answer ID format: `stage2_arrangeVerse_{questionId}_{teamId}`

Submitted answer is serialized as fragments joined with ` | `.

Fields written on confirm:

- `teamId`, `teamName`, `stage: "stage2"`, `field: "arrangeVerse"`
- `questionId`, `questionIndex`, `questionText`, `answer`
- `confirmed: true`, `confirmedAt`, `isCorrect`, `pointsDelta`
- `createdAt`, `updatedAt`

## Scoring (Sprint 3.6)

- Correct order: **+15** (`pointsDelta: 15`)
- Wrong order: **0** (no penalty)
- Updates `stageScores.stage2` and `totalScore` transactionally
- Updates `progress.stage2QuestionIndex` to `questionIndex + 1`
- Does **not** update `progress.stage2FieldIndex`

## Duplicate scoring prevention (Sprint 3.6)

If an answer document already exists with `confirmed: true`:

- No additional points are applied
- Existing result is returned
- UI may continue to the next question without duplicate score

## Field progression (unchanged)

- **إنهاء هذا المجال التجريبي** still moves to the next field (Sprint 3.2 flow)

## Timer behavior

If `competitions/main/system/timer` is active with:

- `stage: "stage2"`
- `purpose: "answering"`
- expired

Then interaction is blocked with:

**انتهى وقت الإجابة، بانتظار توجيه الميسر**

On Firestore failure:

**تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.**

## Intentionally not implemented

- `completeVerse` and `trueFalseCorrect` question UI and answer engines
- Stage 2 ranking
- Excel import
- Stage 3 / Stage 4
- Automatic field progression after arrange questions complete

## Key files

| File | Role |
|------|------|
| `features/stage2/stage2-arrange-verse-types.ts` | Question/answer types |
| `features/stage2/stage2-arrange-verse-mock-questions.ts` | 5 mock questions |
| `features/stage2/confirm-stage2-arrange-verse-answer.ts` | Firestore transaction |
| `features/stage2/components/stage2-arrange-verse-question-card.tsx` | Reorder + confirm UI |
| `features/stage2/components/stage2-arrange-verse-field-screen.tsx` | 5-question flow |
| `features/stage2/components/stage2-player-turns-screen.tsx` | Routes arrangeVerse field |

## Stage 1 freeze

Stage 1 logic is unchanged per `docs/stage1-freeze-v1.md`.
