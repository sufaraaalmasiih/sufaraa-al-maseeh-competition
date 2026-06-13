# Stage 3 Board Foundation — على المحك (Sprint 4.2)

## Purpose

Sprint 4.2 adds the **visual mock board** for Stage 3 **على المحك** when `gameFlow.status === "stage3_board"`.

**No gameplay:** no answering, no scoring writes, no Firestore answer documents, no timers, no question selection writes.

**Prior sprints:** Stage 1/2 Frozen v1 · Sprint 4.1 Stage 3 Foundation complete.

---

## When the board appears

| Route | Condition | Component |
|-------|-----------|-----------|
| `/team` | `stage3_board` | `Stage3Board variant="team"` |
| `/audience` | `stage3_board` | `Stage3Board variant="audience"` |
| `/facilitator` | `stage3_board` | `Stage3Board variant="facilitator"` |

Other Stage 3 statuses still use Sprint 4.1 placeholder screens.

---

## Fields (5 active)

Six fields exist in official rules; **أقوال** is excluded from this sprint mock.

| # | Key | Arabic label |
|---|-----|--------------|
| 1 | `characters` | شخصيات |
| 2 | `miracles` | معجزات |
| 3 | `parables` | أمثال |
| 4 | `timePlace` | زمان ومكان |
| 5 | `numbers` | أعداد |

Source: `features/stage3/stage3-board-data.ts` → `STAGE3_BOARD_FIELD_DEFINITIONS`

---

## Questions per field

Each field has **6 mock question cells** in fixed order:

| Order | Difficulty | Arabic |
|------:|------------|--------|
| 1 | easy | سهل |
| 2 | easy | سهل |
| 3 | medium | متوسط |
| 4 | medium | متوسط |
| 5 | hard | صعب |
| 6 | hard | صعب |

**Total board cells:** 5 fields × 6 questions = **30**

Mock question IDs (for future selection, not shown on team/audience UI):

```
{fieldKey}_q{1..6}
```

Examples: `characters_q1`, `miracles_q4`, `numbers_q6`

---

## Score preview (display only)

Preview metadata matches the official competition scoring table. **Not calculated or saved.**

| Difficulty | صاحب الدور | باقي الفرق |
|------------|------------|------------|
| سهل | +15 | +5 |
| متوسط | +30 | +10 |
| صعب | +45 | +15 |

Source: `STAGE3_SCORE_PREVIEW_BY_DIFFICULTY` in `stage3-board-data.ts`

Wrong-answer penalties are documented in `docs/stage3-official-rules.md` but **not shown** on the board in Sprint 4.2.

---

## Board data structure

```ts
Stage3BoardField {
  key: string;           // e.g. "characters"
  label: string;         // Arabic field name
  questions: Stage3BoardQuestion[];
}

Stage3BoardQuestion {
  id: string;            // e.g. "characters_q1"
  fieldKey: string;
  number: number;        // 1–6 within field
  difficulty: "easy" | "medium" | "hard";
  difficultyLabel: string;
  scorePreview: {
    ownerPoints: number;
    otherTeamsPoints: number;
  };
}
```

Exports:

- `STAGE3_BOARD_FIELDS` — full board tree
- `STAGE3_BOARD_TITLE` — لوحة على المحك
- `STAGE3_BOARD_QUESTION_COUNT` — 30

---

## UI component

`features/stage3/components/stage3-board.tsx`

Renders:

- Title: **لوحة على المحك**
- Responsive grid: 1 → 2 → 3 → 5 columns
- Five field columns, each with six read-only question cards
- Each card: question number (س1–س6), difficulty badge, score preview lines
- Facilitator variant adds banner: **اختيار السؤال سيتم تفعيله في Sprint 4.3**

Cells are **not clickable** — static `div` cards only.

Design: Arabic RTL, calm blue/green palette (`#143A5A`, `#4F8A10`, `#F3FAFF`), consistent with Stages 1–2.

---

## Module layout

```
features/stage3/
├── stage3-board-data.ts          Mock fields, questions, score preview
└── components/
    └── stage3-board.tsx          Shared board UI (team / audience / facilitator)
```

Wired from:

- `features/team/components/team-shell.tsx`
- `features/audience/components/audience-shell.tsx`
- `features/facilitator/components/facilitator-shell.tsx`

---

## Manual verification

1. Set `gameFlow.status = "stage3_board"` and `currentStage = "stage3"` via facilitator.
2. Open `/team` — board visible, read-only, no selection.
3. Open `/audience` — same board layout.
4. Open `/facilitator` — board + Sprint 4.3 note + progress table.
5. Confirm **no** new documents under `competitions/main/answers/`.
6. Confirm `teamStates` scoring fields unchanged (`stageScores.stage3` stays 0).
7. Run `npm run typecheck`, `npm run lint`, `npm run build`.

---

## Next sprint (4.3)

- Turn owner question selection (clickable cells)
- Write `progress.stage3SelectedQuestionId`
- Transition to `stage3_question_open`
- Answer engine foundation

---

## Out of scope (Sprint 4.2)

- Answering / confirm flow
- Scoring writes / negative penalties
- Firestore answer documents
- Timers (15 s selection, 20 s answer, 10 s reveal)
- Turn owner highlight / rotation
- Used-cell state on board
- Live Stage 3 ranking
- Stage 1 / Stage 2 changes
- Auth / routing changes
