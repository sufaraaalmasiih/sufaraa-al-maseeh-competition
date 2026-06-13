# Stage 3 Foundation — على المحك (Sprint 4.1)

## Purpose

Sprint 4.1 builds the **foundational Stage 3 structure** for **على المحك** without implementing gameplay, scoring, timers, or answer engines. All routes, placeholders, and facilitator buttons are ready for Sprints 4.2–4.4.

**Authoritative rules:** `docs/stage3-official-rules.md`

---

## gameFlow statuses

Official Stage 3 lifecycle statuses (defined in `types/index.ts`):

| Status | Arabic label (team/facilitator) | currentStage |
|--------|--------------------------------|--------------|
| `stage3_intro` | شرح مرحلة على المحك | `stage3` |
| `stage3_board` | لوحة على المحك | `stage3` |
| `stage3_question_open` | سؤال على المحك — الإجابة | `stage3` |
| `stage3_reveal` | مرحلة على المحك — الإعلان | `stage3` |
| `stage3_finished` | انتهت مرحلة على المحك | `stage3` |

**Lifecycle (official):**

```
stage3_intro → stage3_board ⇄ stage3_question_open → stage3_reveal → stage3_board → … → stage3_finished
```

Sprint 4.1 implements **placeholders only** — facilitator buttons can step through statuses linearly for testing, but Sprint 4.2+ will implement the looping board return after reveal.

Source: `features/stage3/stage3-constants.ts` → `STAGE3_STATUSES`

### Status rename (pre–Sprint 4.2 cleanup)

| Removed (Sprint 4.1 draft) | Replaced with (official) |
|----------------------------|--------------------------|
| `stage3_selection` | `stage3_board` |
| `stage3_running` | `stage3_question_open` |

---

## Placeholder screens

### `/team`

Component: `Stage3TeamPlaceholderScreen`

Renders for all five Stage 3 statuses. Shows:

- Assigned team name
- Role (`فريق`)
- `currentStage`
- `status`
- `progress.stage3SelectedQuestionId`
- `progress.stage3.currentField`
- `progress.stage3.questionIndex`
- `stageScores.stage3`

Testing note displayed: **No answers, scoring, or timers implemented yet.**

Hook: `useTeamStage3Context`

### `/audience`

Component: `Stage3AudiencePlaceholder`

Static placeholder cards mirroring team status without active answers.

### `/facilitator`

- Flow buttons for all Stage 3 statuses (in `gameFlowControls`)
- Banner + testing note when any Stage 3 status is active
- `Stage3ProgressTable` — read-only team table

---

## Facilitator buttons

| Button (Arabic) | Effect |
|-----------------|--------|
| شرح مرحلة على المحك | `gameFlow.status = "stage3_intro"`, `currentStage = "stage3"` |
| لوحة على المحك | `gameFlow.status = "stage3_board"` |
| فتح السؤال | `gameFlow.status = "stage3_question_open"` |
| الإعلان | `gameFlow.status = "stage3_reveal"` |
| إنهاء المرحلة الثالثة | `gameFlow.status = "stage3_finished"` (via `finishStage3()` — also stops central timer) |

**Not implemented in Sprint 4.1:** selection timer (15 s), answer timer (20 s), reveal timer (10 s), scoring writes, question selection UI, automatic board return after reveal.

---

## Firestore placeholders

### Team state

Path: `competitions/main/teamStates/{teamId}`

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `progress.stage3SelectedQuestionId` | string | `""` | Facilitator-driven question selection (future) |
| `stageScores.stage3` | number | `0` | Stage 3 points placeholder |
| `progress.stage3.currentField` | string | `""` | Active field placeholder |
| `progress.stage3.questionIndex` | number | `0` | Question index placeholder |

Initialized in `createInitialTeamState()` (`firebase/firestore.ts`).

### Answer documents

**No answer documents are created in Sprint 4.1.**

Future path pattern:

```
competitions/main/answers/stage3_{questionId}_{teamId}
```

Constant: `STAGE3_ANSWER_ID_PATTERN` in `features/stage3/stage3-constants.ts`

---

## Module layout

```
features/stage3/
├── stage3-constants.ts              STAGE3_NAME, statuses, answer ID pattern
├── use-team-stage3-context.ts         Team screen Firestore hook
├── use-stage3-team-progress-list.ts   Facilitator progress table hook
└── components/
    ├── stage3-team-placeholder-screen.tsx
    ├── stage3-audience-placeholder.tsx
    └── stage3-progress-table.tsx
```

Wired from:

- `features/team/components/team-shell.tsx`
- `features/audience/components/audience-shell.tsx`
- `features/facilitator/components/facilitator-shell.tsx`

---

## Manual verification checklist

1. Open `/team`, `/audience`, `/facilitator` in separate tabs.
2. Cycle through Stage 3 statuses via facilitator flow buttons.
3. Confirm placeholders render on team and audience for each status.
4. Confirm `Stage3ProgressTable` shows team name, `stage3SelectedQuestionId`, and `stageScores.stage3`.
5. In Firestore, verify team documents have `stageScores.stage3: 0` and empty `progress.stage3SelectedQuestionId`.
6. Confirm **no** documents exist under `competitions/main/answers/` with IDs matching `stage3_*`.
7. If `gameFlow.status` was set to legacy values (`stage3_selection`, `stage3_running`), reset to an official status.
8. Run `npm run typecheck`, `npm run lint`, `npm run build`.

---

## Next sprints

| Sprint | Focus |
|--------|-------|
| **4.2** | Board UI, field grid, turn owner selection, `stage3SelectedQuestionId` writes |
| **4.3** | Answer engine, answer documents, owner/other team submission flow |
| **4.4** | Scoring (including negative penalties), timers (15 / 20 / 10 s), live ranking |

### Implementation notes

- Do **not** modify Stage 1 or Stage 2 frozen logic.
- Scoring table is documented in `docs/stage3-official-rules.md` (user-confirmed values).
- After reveal, `gameFlow` must return to `stage3_board` centrally (Sprint 4.2+).
- Extend `CompetitionTimerStage` and `TimerPurpose` when adding Stage 3 timers.

---

## Out of scope (Sprint 4.1)

- Board UI and question selection mechanics
- Answer engine
- Scoring writes / negative scoring
- Timers (selection / answering / reveal)
- Live ranking
- Excel import
- Stage 4 logic
- Any Stage 1/2 modifications
