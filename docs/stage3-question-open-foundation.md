# Stage 3 Question Open Foundation — على المحك (Sprint 4.3)

## Purpose

Sprint 4.3 adds **question selection on the board** and the **question open screen** for Stage 3 **على المحك**, without answering, scoring, timers, or Firestore answer documents.

**Prior:** Sprint 4.1 Foundation · Sprint 4.2 Board Foundation · Stage 1/2 Frozen v1.

---

## Official lifecycle segment

```
stage3_board  →  (select cell + فتح السؤال)  →  stage3_question_open
```

Full loop (future sprints):

```
stage3_board ⇄ stage3_question_open → stage3_reveal → stage3_board → … → stage3_finished
```

---

## Selection flow (facilitator)

1. Set `gameFlow.status = "stage3_board"`.
2. On facilitator panel, click a question cell on the board (interactive).
3. Cell highlights with a green ring (pending selection — local state only).
4. Click **فتح السؤال**.
5. Firestore `gameFlow` updates:
   - `status = "stage3_question_open"`
   - `stage3ActiveQuestion` — metadata object (temporary foundation field)
   - `stage3OpenedQuestionIds` — append question `id` (marks cell as **مُختار**)
6. Team, audience, and facilitator screens show `Stage3QuestionOpenScreen`.

Returning to board via **لوحة على المحك** clears `stage3ActiveQuestion` but keeps `stage3OpenedQuestionIds`.

---

## Question metadata

File: `features/stage3/stage3-question-types.ts`

```ts
type Stage3Difficulty = "easy" | "medium" | "hard";

interface Stage3QuestionMetadata {
  id: string;           // e.g. characters_q1
  fieldId: string;      // e.g. characters
  fieldLabel: string;   // e.g. شخصيات
  difficulty: Stage3Difficulty;
  questionNumber: number; // 1–6 within field
}
```

Conversion from board mock data: `boardQuestionToMetadata()` in `stage3-question-metadata.ts`.

---

## Temporary gameFlow fields (Sprint 4.3 only)

Written to `competitions/main/gameFlow` — **not** the final schema for Sprint 4.4+.

| Field | Type | Purpose |
|-------|------|---------|
| `stage3ActiveQuestion` | object \| null | Active question metadata while `stage3_question_open` |
| `stage3OpenedQuestionIds` | string[] | IDs opened at least once — board shows **مُختار** badge |

Read via `useGameFlow()` → `stage3ActiveQuestion`, `stage3OpenedQuestionIds`.

**Not written:** `teamStates.progress.stage3SelectedQuestionId` (deferred), answer documents, scores.

---

## Question open screen

Component: `features/stage3/components/stage3-question-open-screen.tsx`

Displays:

- Stage title (على المحك)
- Field name, question number, difficulty badge
- Owner team placeholder: `فريق صاحب الدور — سيتم تحديده لاحقاً`
- Question placeholder: `سيتم ربط السؤال الحقيقي في Sprint 4.4`

| Route | Variant | Notes |
|-------|---------|-------|
| `/team` | `team` | Read-only, no answer controls |
| `/audience` | `audience` | Read-only |
| `/facilitator` | `facilitator` | + banner: **الإجابات وتسجيل النقاط سيتم تفعيلها في Sprint 4.4** |

---

## Board visual states

| State | When | Visual |
|-------|------|--------|
| Default | Not opened | Normal cell |
| Pending | Facilitator clicked, not yet opened | Green ring highlight |
| Selected (مُختار) | ID in `stage3OpenedQuestionIds` | **مُختار** badge — **not** “used” |

Used/completed lifecycle deferred until scoring exists (Sprint 4.4+).

---

## Module layout

```
features/stage3/
├── stage3-question-types.ts
├── stage3-question-metadata.ts
├── open-stage3-question.ts
└── components/
    ├── stage3-board.tsx                    (updated — facilitator selection)
    ├── stage3-facilitator-board-panel.tsx  (selection + فتح السؤال)
    └── stage3-question-open-screen.tsx
```

Wired from:

- `features/team/components/team-shell.tsx`
- `features/audience/components/audience-shell.tsx`
- `features/facilitator/components/facilitator-shell.tsx`
- `features/gameflow/use-game-flow.ts` (reads temporary fields)

---

## Limitations (Sprint 4.3)

- No answer options or confirm flow
- No scoring, penalties, or `stageScores` writes
- No Firestore answer documents
- No timers (15 s selection, 20 s answer)
- No turn owner rotation logic
- No automatic return to board after reveal
- `stage3SelectedQuestionId` on team state not written yet

---

## Sprint 4.4 integration (planned)

See **`docs/stage3-answer-architecture.md`** for the canonical answer engine blueprint.

- Real question text from question bank
- Answer engine + `competitions/main/answers/stage3_{questionId}_{teamId}`
- Owner/other team submission
- Scoring writes and penalties
- Write `progress.stage3SelectedQuestionId` on team state
- Turn owner assignment
- Replace temporary `gameFlow.stage3*` fields with finalized schema if needed

---

## Manual verification

1. Facilitator → **لوحة على المحك**.
2. Click a question cell → highlight appears.
3. Click **فتح السؤال** → status becomes `stage3_question_open`.
4. Open `/team`, `/audience` → question metadata visible.
5. Return to board → opened cell shows **مُختار**.
6. Confirm no answer docs and no score changes in Firestore.
7. `npm run typecheck`, `npm run lint`, `npm run build`.

---

## Out of scope

- Scoring / ranking / reveal scoring
- Answer transactions
- Stage 1 / Stage 2 / auth / routing changes
