# Gameplay Compliance Audit — سفراء المسيح

> **Date:** 2026-06-03  
> **Scope:** Stages 1–3 gameplay + UX vs old working build + official rules  
> **Status:** Audit only — **no code changes**  
> **Stage 4:** STOP — not in scope

---

## Sources compared

| Source | Path / version | Role in audit |
|--------|----------------|---------------|
| **Current project** | `codex-master-prompt-v1-sufaraa-al` (Next.js 15 + Firebase) | What is implemented today |
| **Old working project** | `sufaraa-v9-6-75-contestant-gameflow-router-fix` (ZIP → vanilla HTML/JS) | Gameplay/UI reference only |
| **Official rules** | `docs/stage3-official-rules.md` + Master PDF §10 (via project docs) | Authoritative competition rules |

**Old ZIP reference root:** `c:\Users\ASUS\Downloads\_sufaraa_old_ref`  
**Note:** Old project is **not** Next.js; patterns are behavioral, not copy-paste architecture.

---

## Executive summary

The current project has **solid Firestore answer engines** for Stages 1–3 (confirm transactions, scoring guards, Stage 3 reveal/ranking in Sprint 4.5). However, several screens are **technically wired** but **gameplay-wrong**: wrong question interaction types, facilitator-only flows where teams should act, mock-only banks, and placeholder/read-only shells.

**Biggest blockers before Stage 4 or live competition:**

1. Stage 2 field UIs do not match old or official interaction models (matching, complete verse, arrange).
2. Stage 3 owner/selection is facilitator-driven; team/audience boards are read-only.
3. Stage 1 question types and bank size diverge from old + official scale.
4. Cross-cutting UX: slow transitions, missing instant moderator-wait on Stage 1 Q50, audience gaps in Stage 2 play.

---

## Technically correct vs gameplay-wrong

| Area | Technically correct | Gameplay-wrong |
|------|---------------------|----------------|
| Stage 1 confirm + Firestore | Transaction, +5/0, duplicate guard, timer/status checks | Only 6 mock questions; `arrange` is single MC pick; no ماذا ينقص / فراغات typed UI; local index not synced to 50-question plan |
| Stage 2 confirm + Firestore | Per-field answers, +15/0, progress index, role lock | Matching = MC; complete = MC; arrange confirm gate broken vs `correctOrder`; correction text not scored; no per-turn auto-start timer |
| Stage 3 scoring/reveal | Official +/- table, owner no-answer, reveal reads stored deltas, used cells | Owner picked by facilitator; no selection timer; team cannot pick board cell; board footer still says “no scoring” on facilitator open |
| GameFlow | Central `gameFlow.status` + hooks | Facilitator must manually start most timers; flow-control can skip reveal/used lifecycle |
| Audience | Stage 1/3 partial sync | Stage 2 player turns / roles not shown; Stage 3 intro placeholder |

---

## Stage 1 issues — اجمعوا الكنوز

### Official / old reference

- **Old:** 50 questions in fixed order; types: اختر من متعدد، ماذا ينقص، فراغات، رتّب (tap-to-order, not drag); +5/0; on **last question** → **instant** moderator-wait (“أحسنتم! … بانتظار الميسر”) **before** Firestore save completes; no blessing overlay; `gameFlow.status` is routing authority (v9.6.75).
- **Official (PDF §10 via docs):** Stage 1 scoring and question mix per competition plan; central timer; facilitator advances stage.

### Current behavior

| Topic | Current | Gap |
|-------|---------|-----|
| **Transition speed (audit #1)** | Fixed **850ms** auto-advance after each confirm (`stage1-running-screen.tsx`) | Feels slow vs old instant wait on final Q; no distinction between mid-run vs end-of-stage |
| **Finished blessing/wait (audit #2)** | Team: `stage1-team-finished-screen.tsx` shows “أحسنتم!” + score + “بانتظار توجيه الميسر” when `stage1_finished` | Does **not** trigger on last mock question locally — only when facilitator sets `stage1_finished`; mock bank ends with empty state “انتهت الأسئلة التجريبية…” while still in `stage1_running` |
| **Question types (audit #3)** | Mock: `missing`, `multiple_choice`, `arrange` (6 total) (`stage1-mock-questions.ts`) | **Missing:** ماذا ينقص / فراغات as **text input**; **رتّب** as **multi-tap ordering** (old: join with `\|`); `arrange` rendered as **one MC option** from `parts` (`stage1-question-card.tsx`) |
| **Question bank** | 6 mock questions | Old: **50** from `DATA.stage1` / Excel plan |
| **Scoring** | +5 correct, 0 wrong | Aligns with old simple model |
| **Timer** | Facilitator starts Stage 1 timer manually | Old: long stage clock + flow timer integration |

### Audit item mapping

| # | Finding | Severity |
|---|---------|----------|
| 1 | 850ms delay every question; no instant end-of-stage on last answer | P1 |
| 2 | Wait/blessing tied to `stage1_finished` status, not last-answer instant wait | P0 (competition flow) |
| 3 | Question types and count ≠ old + official scale | P0 |

### Current files needing patches

- `features/stage1/components/stage1-running-screen.tsx`
- `features/stage1/components/stage1-question-card.tsx`
- `features/stage1/stage1-mock-questions.ts` (+ future bank import)
- `features/stage1/stage1-types.ts`
- `features/team/components/team-shell.tsx` (routing on last Q)
- `features/facilitator/components/facilitator-shell.tsx`

### Old project reference files

- `contest-fixes-v9542.js` — `renderStage1Question`, `bindStage1Answers`, `showQ1`, `answerStage1`
- `contestant-ui-polish-v9654.js` — instant wait on Q50
- `contestant-game-flow.js` — `renderWaiting`, `finishStage`, gameFlow authority
- `script.js` — `buildStage1Plan`, `s1RenderArrange`, `s1RenderInput`
- `STAGE1_FINAL_INSTANT_WAIT_V9662_REPORT.md`, `STAGE1_FINAL_FLOW_FIX_V9661_REPORT.md`, `CONTESTANT_FLOW_V9675_GAMEFLOW_ROUTER_FIX.md`

---

## Stage 2 issues — فتشوا الكتب

### Official / old reference

- **Four fields in sequence:** matching → complete → correct → truefalse.
- **Roles:** 4 role types; **one distinct player per type**; locked; names visible in header/chips during play.
- **Timers:** Manual “بدء مهمة {player}” per turn + **150s auto** per field turn; reading phase separate.
- **Matching:** **Two columns** — select left prompt, then right answer; pair/unpair; batch confirm.
- **Complete (أكمل الآيات):** **Typed** text input.
- **Correct (صحح الخطأ):** Select **word/part**, type correction; wrong part → 0 pts.
- **True/false:** Select صح/خطأ then **تأكيد** (not instant tap).

### Current behavior

| Topic | Current | Gap |
|-------|---------|-----|
| **Player names (audit #4)** | `roles[currentField.key]` on active field only (`stage2-player-turns-screen.tsx`); `Stage2RoleSummary` shows all 4 when locked | No uniqueness enforcement (same player on multiple fields); audience/facilitator don’t see live “who plays which field” during `stage2_player_turns`; no role chips bar like old |
| **Timers (audit #5)** | **Reading:** facilitator starts 180s (`facilitator-shell.tsx`) | **Answering:** screens read timer but **no facilitator control to start** `stage2` answering timer — if inactive, unlimited time; old has per-turn **start button + 150s auto** |
| **Matching (audit #6)** | Left prompt + **MC options** (`stage2-matching-question-card.tsx`) | Not two-column pairing |
| **Arrange verse (audit #7)** | **Up/down arrows only** (`stage2-arrange-verse-question-card.tsx`) | No drag-and-drop; old Stage 1 arrange used **tap sequence** (still not HTML5 DnD) |
| **Arrange confirm (audit #8)** | Requires `hasReordered` + `currentOrder` matching `question.fragments` (initial shuffle) | **Blocks valid play:** `fragments` ≠ `correctOrder` in mocks — confirm gated on wrong reference; cannot confirm when shuffled display already equals `correctOrder` without a move |
| **Complete verse (audit #9)** | **MC options** (`stage2-complete-verse-question-card.tsx`) | Old: **typed** input |
| **True/false + correction (audit #10)** | UI: صح/خطأ + textarea if خطأ (`stage2-true-false-correct-question-card.tsx`) | Scoring: `correctIsTrue` only — **correction text not validated** (`confirm-stage2-true-false-correct-answer.ts`) |
| **Field advance** | Auto next question (850ms); manual “إنهاء هذا المجال التجريبي” between fields | Old: handoff card + `startStage2Turn` per type |

### Audit item mapping

| # | Finding | Severity |
|---|---------|----------|
| 4 | Player names partial; no unique-player rule; weak cross-field visibility | P1 |
| 5 | No auto/per-turn answering timer start like old | P1 |
| 6 | Matching is MC, not two-column | P0 |
| 7 | Arrange is up/down only (DnD is acceptable upgrade if confirm works) | P1 |
| 8 | Arrange confirm gate logic broken / blocks correct-order submit | P0 |
| 9 | Complete verse is MC not typed | P0 |
| 10 | Correction not part of scoring | P1 |

### Current files needing patches

- `features/stage2/components/stage2-matching-question-card.tsx`
- `features/stage2/components/stage2-arrange-verse-question-card.tsx`
- `features/stage2/components/stage2-complete-verse-question-card.tsx`
- `features/stage2/components/stage2-true-false-correct-question-card.tsx`
- `features/stage2/components/stage2-role-assignment-screen.tsx`
- `features/stage2/components/stage2-player-turns-screen.tsx`
- `features/stage2/confirm-stage2-true-false-correct-answer.ts`
- `features/facilitator/components/facilitator-shell.tsx`
- `features/audience/components/audience-shell.tsx`
- `features/stage2/components/stage2-progress-table.tsx` (facilitator visibility)

### Old project reference files

- `script.js` — `renderStage2Sequential`, `renderMatchingGroupV9616`, `startStage2Turn`, `finishStage2TurnByTime`, `renderStage2Item`
- `stage2-correction-v9638.js` — `answer2` validation
- `contestant-game-flow.js` — `stage2SecondsLeft`
- `data.js` — `DATA.stage2` groups
- `STAGE1_STAGE2_STAGE4_FIX_V9660_REPORT.md`

---

## Stage 3 issues — على المحك

### Official / old reference

- **Board:** 5-of-6 fields, 30 cells, 2/2/2 difficulty; **owner team** selects cell; others answer/pass; 15s selection / 20s answer / 10s reveal.
- **Old v9646:** `meta/stage3Final` state machine; **contestant (turn team)** taps board; others wait/skip; admin controls + auto timeouts; audience read-only board but **full reveal**; return to board after reveal; negative scoring on reveal from stored answers.

### Current behavior

| Topic | Current | Gap |
|-------|---------|-----|
| **Board workflow (audit #11)** | Facilitator: interactive board + owner picker + open question + reveal + return (`stage3-facilitator-board-panel.tsx`, `start-stage3-reveal.ts`, `return-to-stage3-board.ts`) | **Owner does not select cell** — facilitator selects; **no selection-phase timer**; **no auto** return after reveal; no `stage3Final` auto-advance |
| **Read-only shells (audit #12)** | Team/audience board: `interactive={false}` (`team-shell.tsx`, `audience-shell.tsx`); placeholders for `stage3_intro` still say “no answers yet” | Gameplay-central actions on **facilitator only**; teams cannot pick questions per official rules |
| **Question open** | Team MC + pass (non-owner); owner no-answer on expiry | Engine OK; mock bank only |
| **Reveal** | Facilitator بدء الإعلان; results from Firestore; ranking live | No progressive audience reveal animation (old had gated reveal); acceptable P2 |
| **Used cells** | `stage3UsedQuestionIds` after reveal | Good; flow-control skip can bypass |
| **Scoring** | Official table in `stage3-scoring.ts` | Aligns when answers submitted |

### Audit item mapping

| # | Finding | Severity |
|---|---------|----------|
| 11 | Full loop exists but **owner/board interaction on wrong role** (facilitator vs owner team) | P0 |
| 12 | Team/audience boards read-only; stale placeholder copy | P0 |
| 11 (sub) | Selection timer (15s) not implemented | P1 |
| 11 (sub) | Turn rotation not automatic | P1 |

### Current files needing patches

- `features/stage3/components/stage3-board.tsx` (team interactive when owner + choosing)
- `features/stage3/components/stage3-facilitator-board-panel.tsx`
- `features/stage3/open-stage3-question.ts`
- `features/stage3/set-stage3-owner.ts`
- `features/team/components/team-shell.tsx`
- `features/audience/components/audience-shell.tsx`
- `features/stage3/components/stage3-team-placeholder-screen.tsx`
- `features/stage3/components/stage3-audience-placeholder.tsx`
- `features/facilitator/components/facilitator-shell.tsx`
- `features/gameflow/use-competition-timer.ts` (wire `selection` purpose)

### Old project reference files

- `stage3-contestant-v9646.js` — board tap, question open, skip
- `stage3-admin-v9646.js` — reveal, next turn, auto timeouts
- `stage3-shared-v9646.js` — questions, timers, helpers
- `audience-script.js` — `renderStage3`, reveal gate, return board
- `AUDIENCE_V9672_STAGE3_ALWAYS_RETURN_BOARD.md`
- `docs/stage3-official-rules.md` (numeric rules; note header says “not started” but code has partial impl)

---

## Design / UX issues

### Audit #13 — Match or exceed old project quality

| Area | Old project | Current | Gap |
|------|-------------|---------|-----|
| Visual density | `style.css`, `contestant-ui-polish-v9654.css`, stage3/4 CSS | Tailwind cards, cleaner but sparse | Less “game show” energy; weak headers/animations on audience |
| Player header | Score + stage icons + team name persistent | Per-screen cards | No persistent contestant header |
| Stage 2 handoff | “بدء مهمة {player}” card + live turn timer | Jump straight into questions | Missing dramatic handoff |
| Stage 3 board | Used/active/level styling, turn name | Board exists but disclaimer text undermines UX (“لا إجابات…”) | Copy/design mismatch with real engine |
| Facilitator panel | Dedicated admin game flow | Single tab “flow” + placeholders for other tabs | Weak operator UX |
| Audience sync | Stage 3 reveal animations, headers (v9665–v9674 reports) | Tables/cards, limited motion | P2 polish |
| Arabic RTL | Mature in old build | RTL layout OK | Generally OK |

### Design/UX priority

| Item | Priority |
|------|----------|
| Persistent team header (score, stage, name) | P1 |
| Remove misleading “تأسيسي / لا إجابات” copy where engines exist | P1 |
| Stage 2 handoff + turn timer UI | P1 |
| Audience Stage 2 live view | P1 |
| Facilitator ops tab (timer presets, flow helpers) | P2 |
| Reveal animations (Stage 3 audience) | P2 |

### Old project reference files (design)

- `style.css`, `contestant-ui-polish-v9654.css`, `stage3-final-v9646.css`
- `contestant-ui-polish-v9654.js` — header override
- `AUDIENCE_V9673_STAGE3_HEADER_ANIMATIONS_POLISH.md`

---

## Priority order

### P0 — Critical gameplay blockers (must fix before live play)

1. **Stage 2 matching** — implement real two-column pairing (not MC).
2. **Stage 2 complete verse** — typed input (not MC).
3. **Stage 2 arrange verse** — fix confirm gate (`correctOrder` vs `fragments` / `hasReordered`); enable confirm when order already correct.
4. **Stage 1** — real question types (esp. arrange tap-order, text gaps) + end-of-run instant moderator-wait pattern.
5. **Stage 3** — owner **team** selects board cell (facilitator sets turn owner only); team board interactive on turn; remove read-only-as-primary design for contestant.
6. **Stage 1 bank scale** — path to 50 questions (or competition-sized set), not 6 mocks only.

### P1 — Major UX / gameplay issues

1. Stage 1 transition timing (instant on last Q; faster or skippable mid-run).
2. Stage 2 player names across all fields + unique player per role + audience/facilitator visibility.
3. Stage 2 per-turn timer: manual start card + auto countdown (150s).
4. Stage 2 true/false correction scoring validation.
5. Stage 3 selection timer (15s) + turn rotation policy.
6. Arrange verse: drag-and-drop or tap-order (match old Stage 1 pattern).
7. Audience: Stage 2 `player_turns` + role assignment views.
8. Design: persistent header, fix stale copy, handoff cards.

### P2 — Polish

1. Stage 3 progressive reveal / audience animations.
2. Facilitator secondary tabs (controls, log).
3. Excel / question bank admin.
4. `final_results` / podium (out of scope until Stage 4+).
5. Sound, haptics, anti-cheat hardening.

---

## Recommended patch plan

### Sprint A — Stage 2 gameplay restoration (P0)

**Goal:** Make the four field types match old real gameplay.

| Task | Files |
|------|-------|
| A1 Two-column matching UI + confirm payload | `stage2-matching-question-card.tsx`, new matching state helper, `confirm-stage2-matching-answer.ts` (batch pairs) |
| A2 Typed complete verse | `stage2-complete-verse-question-card.tsx`, types |
| A3 Arrange verse: fix confirm gate; tap-order or DnD; allow submit when `currentOrder === correctOrder` | `stage2-arrange-verse-question-card.tsx` |
| A4 True/false: score correction text vs key | `confirm-stage2-true-false-correct-answer.ts`, mock data |
| A5 Per-turn timer + handoff card | `stage2-player-turns-screen.tsx`, `facilitator-shell.tsx`, timer wiring |

**Exit criteria:** Facilitator can run one full Stage 2 with old-style interactions on all four fields.

---

### Sprint B — Stage 1 compliance (P0 + P1)

**Goal:** Question fidelity + competition pacing.

| Task | Files |
|------|-------|
| B1 Implement arrange (multi-tap), gap/fill text types in UI | `stage1-question-card.tsx`, new renderers |
| B2 Last-question instant moderator-wait (before/parallel to Firestore) | `stage1-running-screen.tsx`, align with `gameFlow` |
| B3 Question index from `teamState` / Firestore, not local-only | `stage1-running-screen.tsx`, `confirm-stage1-answer.ts` |
| B4 Expand question bank import (Excel/JSON) — design only if import not ready | new `features/stage1/stage1-question-bank.ts` |
| B5 Reduce or contextualize 850ms delay | `stage1-running-screen.tsx` |

**Exit criteria:** Stage 1 feels like old v9.6.62 end flow; ≥4 question types work correctly.

---

### Sprint C — Stage 3 ownership + interactivity (P0 + P1)

**Goal:** Board loop matches official rules + old v9646.

| Task | Files |
|------|-------|
| C1 Owner team selects cell when `stage3_board` + `stage3OwnerTeamId === myTeam` | `stage3-board.tsx`, new `select-stage3-question.ts` (team) |
| C2 Facilitator: set turn owner only; optional “open” becomes automatic on owner pick | `stage3-facilitator-board-panel.tsx`, `open-stage3-question.ts` |
| C3 Selection timer 15s | `open-stage3-question.ts`, `use-competition-timer.ts`, facilitator UI |
| C4 Remove/fix placeholder copy on intro/team/audience | placeholder screens, board footer |
| C5 Turn rotation after return-to-board | `return-to-stage3-board.ts`, gameFlow fields |
| C6 Audience: show board + timers during choosing (read-only for non-owner) | `audience-shell.tsx` |

**Exit criteria:** One full Stage 3 round: owner picks → all answer → reveal → used cell → board, without facilitator clicking cells.

---

### Sprint D — Cross-cutting UX (P1 + P2)

| Task | Focus |
|------|-------|
| D1 Persistent contestant header (score, team, stage) | team shell |
| D2 Audience Stage 2 sync | `audience-shell.tsx` |
| D3 Facilitator timer presets (stage2 answer, stage3 selection) | `facilitator-shell.tsx` |
| D4 Stage 3 reveal polish | audience reveal components |
| D5 Harden flow-control: no skip reveal/used | `facilitator-shell.tsx` `setStatus` guards |

---

### Sprint E — Data & ops (P2, pre–Stage 4)

| Task | Focus |
|------|-------|
| E1 Question bank pipeline (Stage 1–3) | admin + import |
| E2 Firestore security rules audit | rules |
| E3 `stage3_finished` / rankings polish | shells |
| E4 Do **not** start Stage 4 until A–C exit criteria met | — |

---

## Appendix A — Old project file index (correct patterns)

| Pattern | Primary files |
|---------|----------------|
| GameFlow authority | `game-flow-core.js`, `contestant-game-flow.js`, `admin-game-flow.js` |
| Stage 1 UI + answers | `contest-fixes-v9542.js`, `script.js` |
| Stage 1 instant wait | `contestant-ui-polish-v9654.js` |
| Stage 2 sequential play | `script.js` (v9616 blocks), `stage2-correction-v9638.js` |
| Stage 3 full loop | `stage3-shared-v9646.js`, `stage3-contestant-v9646.js`, `stage3-admin-v9646.js`, `audience-script.js` |
| Data | `data.js`, `data.json` |
| Auth | `auth.js`, `firebase-init.js` |

---

## Appendix B — Current project file index (patch targets)

| Stage | Core |
|-------|------|
| Shells | `features/team/components/team-shell.tsx`, `features/audience/components/audience-shell.tsx`, `features/facilitator/components/facilitator-shell.tsx` |
| GameFlow | `features/gameflow/use-game-flow.ts`, `use-competition-timer.ts` |
| Stage 1 | `features/stage1/*` |
| Stage 2 | `features/stage2/*` |
| Stage 3 | `features/stage3/*` |
| Docs (rules) | `docs/stage3-official-rules.md`, `docs/stage1-freeze-v1.md`, `docs/stage2-freeze-v1.md` |

---

## Appendix C — Official rules quick reference

| Rule | Value |
|------|-------|
| Stage 3 fields | 5 of 6 active, 6 questions each, 30 cells |
| Timers | Selection 15s, Answer 20s, Reveal 10s |
| Turn owner | Must answer; others may answer or pass (0) |
| Owner scoring | +15/+30/+45 correct; −5/−10/−15 wrong or no answer |
| Other scoring | +5/+10/+15 correct; −5/−10/−15 wrong; 0 pass/no answer |
| Central timer | Facilitator/system writes; all clients read |

---

## Freeze reminder

Per `docs/stage1-freeze-v1.md` and `docs/stage2-freeze-v1.md`, Stages 1–2 are **frozen for bugfix-only**. This audit recommends **gameplay-compliance patches** that intentionally go beyond cosmetic freeze — treat as **approved exception** for competition readiness, not drive-by refactors.

**Stage 4:** Do not implement until Sprint A–C exit criteria are met.

---

*End of audit — documentation only, no code changes.*
