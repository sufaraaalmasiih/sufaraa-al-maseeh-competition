# Stage 3 Reveal + Ranking — على المحك (Sprint 4.5)

> **Date:** 2026-06-03  
> **Builds on:** Sprint 4.4 Answer Engine · Sprint 4.4.1 Hardening

---

## Purpose

Implement the official **reveal phase**, **live Stage 3 ranking**, **used-question lifecycle**, and **return-to-board** flow for **على المحك**.

**Frozen (not modified):** Stage 1, Stage 2, auth, routing.  
**Not in scope:** Stage 4, final competition results, podium.

---

## 1. Reveal flow

### Transition

Facilitator triggers reveal from `stage3_question_open` via:

- **بدء الإعلان** on the facilitator panel, or
- Flow control button **الإعلان** (calls `startStage3Reveal()`).

`startStage3Reveal()`:

1. Requires `gameFlow.status === stage3_question_open` and `stage3ActiveQuestion`.
2. Sets all answer docs for the active `questionId` to `visibleToAudience: true`.
3. Appends active question id to `gameFlow.stage3UsedQuestionIds`.
4. Sets `status` → `stage3_reveal`.
5. Starts central reveal timer (`stage3` / `reveal`, 10 s).

### Display (read stored results only)

| Role | Content |
|------|---------|
| **Facilitator** | Field, question number, difficulty, correct answer; table: Team, Answer, Outcome, Points (`pointsDelta` from docs) |
| **Audience** | Same table (read-only) |
| **Team** | Personal answer, correct answer, outcome, points from own answer doc |

**No score recomputation** at reveal — values come from Firestore answer documents written at confirm / owner no-answer time.

### Return to board

**العودة إلى اللوحة** → `returnToStage3Board()`:

- `status` → `stage3_board`
- Clears `stage3ActiveQuestion` only
- Keeps `stage3OpenedQuestionIds` and `stage3UsedQuestionIds`
- Stops timer

---

## 2. Ranking

### Module

- `features/stage3/stage3-ranking.ts` — sort + rank
- `features/stage3/use-stage3-ranking.ts` — live `teamStates` subscription
- `features/stage3/components/stage3-ranking-table.tsx`

### Source

`competitions/main/teamStates` — fields `teamName`, `stageScores.stage3`, `totalScore`.

### Sort order

1. `stageScores.stage3` DESC  
2. `totalScore` DESC  
3. `teamName` ASC (Arabic locale)

### Where shown

| Status | Facilitator | Audience | Team |
|--------|-------------|----------|------|
| `stage3_board` | ✓ | ✓ | ✓ |
| `stage3_question_open` | ✓ | — | — |
| `stage3_reveal` | ✓ | ✓ | ✓ |
| `stage3_finished` | ✓ (finished screen) | ✓ | ✓ |

Stage 3 finished shows **Stage 3 ranking only** — not full competition ranking.

---

## 3. Used-question lifecycle

| State | Board UI | Selection |
|-------|----------|-----------|
| **Available** | No badge | Selectable (facilitator) |
| **Selected** | Badge «محدد» | Pending open |
| **Opened** | Badge «مُفتوح» | Still visible; not used until reveal |
| **Used** | Badge «مُستخدم», dimmed | Disabled; `openStage3Question` rejects |

After reveal, active question id is appended to `gameFlow.stage3UsedQuestionIds`.

`stage3OpenedQuestionIds` continues to track cells opened at least once.

---

## 4. `stage3_finished`

Facilitator **إنهاء المرحلة الثالثة**:

- `status` → `stage3_finished`
- Clears `stage3ActiveQuestion`
- Stops timer
- All three shells show `Stage3FinishedScreen` + `Stage3RankingTable`

---

## 5. Key files

| File | Role |
|------|------|
| `start-stage3-reveal.ts` | Reveal transition + visibility + used ids |
| `return-to-stage3-board.ts` | Board return |
| `stage3-ranking.ts` | Sort rules |
| `use-stage3-ranking.ts` | Live ranking hook |
| `components/stage3-reveal-*.tsx` | Reveal UI |
| `components/stage3-ranking-table.tsx` | Ranking table |
| `components/stage3-finished-screen.tsx` | End-of-stage screen |

---

## 6. Intentionally not implemented (Sprint 4.5)

- Gradual / animated audience reveal steps  
- Final competition ranking / podium  
- Stage 4  
- Real question bank (still mock)  
- Owner team self-service board selection  
- `stage3UsedQuestionIds` separate from manual flow-control jumps without `startStage3Reveal`
