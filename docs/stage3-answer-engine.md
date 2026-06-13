# Stage 3 Answer Engine — على المحك (Sprint 4.4)

## Implemented

Per `docs/stage3-answer-architecture.md`:

| Module | Path |
|--------|------|
| Scoring + penalties | `features/stage3/stage3-scoring.ts` |
| Answer transaction | `features/stage3/confirm-stage3-answer.ts` |
| Mock question bank | `features/stage3/stage3-mock-questions.ts` |
| Answer doc types | `features/stage3/stage3-answer-types.ts` |
| Answer id helper | `features/stage3/stage3-answer-id.ts` |
| Owner selection | `features/stage3/set-stage3-owner.ts` |
| Open question + timer | `features/stage3/open-stage3-question.ts` (updated) |
| Team answer UI | `features/stage3/components/stage3-team-question-open-screen.tsx` |
| Answer card | `features/stage3/components/stage3-answer-card.tsx` |
| Facilitator answers table | `features/stage3/components/stage3-facilitator-answers-panel.tsx` |

## Answer document path

```
competitions/main/answers/stage3_{questionId}_{teamId}
```

## Flow

1. Facilitator sets **صاحب الدور** on board panel.
2. Select cell → **فتح السؤال** → `stage3_question_open` + 20 s answer timer.
3. Owner team: select answer → confirm (± points by difficulty).
4. Other teams: confirm answer or **تجاوز** (0 points).
5. Facilitator sees live answer table with `pointsDelta`.

## Scoring

Uses `computeStage3PointsDelta()` — owner/other rows with negative penalties per official table.

Updates `teamState.stageScores.stage3` and `totalScore` in the same Firestore transaction.

## Not implemented (deferred)

- Stage 3 live ranking UI
- Reveal phase (`visibleToAudience` batch)
- `stage3UsedQuestionIds` on return from reveal
- Auto owner no-answer penalty at timer expiry

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` — all pass.
