# Stage 2 Gameplay Restoration — فتشوا الكتب

> **Sprint:** A — Stage 2 Gameplay Restoration  
> **Date:** 2026-06-06  
> **Scope:** Stage 2 field UIs + answer payloads only (no Stage 1/3/4, auth, routing, reset)

## What was wrong

| Field | Before |
|-------|--------|
| **توصيل (matching)** | Single multiple-choice per left prompt |
| **رتّب الآية (arrange)** | Up/down only; confirm blocked unless `hasReordered` matched shuffled `fragments` |
| **أكمل الآيات (complete)** | Multiple-choice options |
| **صح/خطأ + تصحيح** | Correction text stored but not scored |
| **Player display** | Name in parent card only; weak م1–م4 labels |
| **Transition** | 850ms delay after each confirm |

## What was fixed

| Field | After |
|-------|--------|
| **Matching** | Two-column pair/unpair UI; color-coded pairs; batch confirm per question |
| **Arrange** | Native HTML5 drag-and-drop + mobile arrow buttons; confirm anytime; shuffled start |
| **Complete verse** | Typed input with Arabic normalization |
| **True/false** | صح/خطأ; خطأ requires correction; full evaluation including correction text |
| **Player display** | `Stage2FieldPlayerHeader` on every field: م{N}, label, player name |
| **Transition** | `STAGE2_QUESTION_ADVANCE_MS = 300` |

## Field behavior

### م1 — توصيل

- Left column: prompts to match
- Right column: shuffled options (seeded)
- Tap left → tap right to pair (shared color)
- Tap paired item to unpair / change
- Confirm when all pairs filled
- Correct when every `left → correctRight` mapping matches

### م2 — رتّب الآية أو الآيات

- Fragments shown in seeded shuffle order
- Drag-and-drop reorder (desktop); arrows on mobile
- Confirm submits current order (no forced reorder move)
- Graded against `correctOrder`

### م3 — أكمل الآيات

- Verse with blank + text input
- Normalized string match vs `correctAnswer`

### م4 — صح أو خطأ مع تصحيح

- صح: correct if statement is true
- خطأ: requires correction text; correct if statement is false AND correction matches `expectedCorrection` (normalized)

## Answer serialization (Firestore)

| Field | `answer` field | Extra fields |
|-------|----------------|--------------|
| matching | `left=>right;;left2=>right2` | `pairings` object |
| arrangeVerse | `frag1 \| frag2 \| ...` | — |
| completeVerse | typed string | — |
| trueFalseCorrect | `صح` or `خطأ \| correction` | `selectedChoice`, `correctionText`, `expectedCorrection` |

Answer doc IDs unchanged: `stage2_{field}_{questionId}_{teamId}`

## Scoring preservation

- Correct: **+15**
- Wrong: **0**
- `runTransaction` duplicate guard unchanged
- `gameFlow.status === stage2_player_turns` guard unchanged
- Stage 2 answering timer guard unchanged
- `progress.stage2QuestionIndex` increment unchanged

## Key files

| File | Role |
|------|------|
| `stage2-matching-question-card.tsx` | Two-column matching UI |
| `stage2-arrange-verse-question-card.tsx` | Drag/drop arrange |
| `stage2-complete-verse-question-card.tsx` | Typed complete |
| `stage2-true-false-correct-question-card.tsx` | صح/خطأ + correction |
| `stage2-field-player-header.tsx` | م1–م4 player banner |
| `stage2-matching.ts` | Pair serialize/evaluate |
| `stage2-true-false-evaluation.ts` | True/false scoring logic |
| `stage2-answer-validation.ts` | Arabic normalization |
| `confirm-stage2-*.ts` | Firestore transactions (payload/scoring updates only) |

## Manual test checklist

- [ ] Reset competition → Stage 2 role assignment → 4 unique players → lock roles
- [ ] Reading phase → player turns
- [ ] **م1:** two-column pair, unpair, confirm, +15/0, auto-advance
- [ ] **م2:** drag reorder (or arrows), confirm without forced move if already correct
- [ ] **م3:** type answer, normalization accepts expected form
- [ ] **م4:** صح on true statement; خطأ + correction on false statement
- [ ] Player name visible on handoff card AND each field header
- [ ] Duplicate answer blocked on refresh
- [ ] Facilitator progress table updates

## Remaining limitations

- Mock question banks only (5 per field)
- Per-turn answering timer still facilitator-started (not auto 150s)
- Unique player per role not enforced in UI (assignment screen unchanged)
- Field order still matching → arrange → complete → true/false (not old complete→correct order)

## Freeze note

Per `docs/stage2-freeze-v1.md`, this sprint is an **approved gameplay-compliance exception** — interaction and grading fidelity only; transaction structure preserved.
