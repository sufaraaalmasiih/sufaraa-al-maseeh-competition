# Stage 3 Official Rules — على المحك

> **Document type:** Official rules extraction + project gap analysis + Sprint 4.1 proposal  
> **Date:** 2026-06-03  
> **Implementation:** Not started — this doc only

---

## 1. Sources

| Source | Role |
|--------|------|
| `Sufaraa-Al-Maseeh-Master-Documentation-v1.pdf` §10 | Stage name, fields, question counts, difficulty, timers, turn flow |
| Official competition plan / scoring table (user-confirmed 2026-06-03) | **Full numeric scoring** (owner, other teams, penalties) |
| Legacy wrong repo label | ~~اكتشفوا الطريق~~ — **not official** |

The master PDF §10 states scoring is configurable; the **numeric table below** is the confirmed competition plan values for implementation.

---

## 2. Stage identity

| Item | Official value |
|------|----------------|
| **Arabic name** | **على المحك** |
| **English context** | Stage 3 of **سفراء المسيح** |
| **Concept** | Strategic stage — teams choose questions by field strength |

---

## 3. Fields (المجالات)

**Six possible fields:**

| # | Field |
|---|-------|
| 1 | شخصيات |
| 2 | معجزات |
| 3 | أمثال |
| 4 | زمان ومكان |
| 5 | أعداد |
| 6 | أقوال |

**Active per competition:** **5 fields selected from 6** (competition settings).

**Question bank (5 active fields):** 5 × 6 = **30 questions** on the board.

---

## 4. Question counts and difficulty

| Rule | Value |
|------|-------|
| Questions per field | **6** |
| Easy (سهل) | **2** |
| Medium (متوسط) | **2** |
| Hard (صعب) | **2** |

---

## 5. Timers (official defaults)

| Phase | Arabic | Duration |
|-------|--------|----------|
| Selection | اختيار السؤال | **15 seconds** |
| Answer | الإجابة | **20 seconds** |
| Reveal | الإعلان / reveal | **10 seconds** |

Central timer only — facilitator/system writes; all screens read (master doc §18).

---

## 6. Turn order and participation (official §10)

| Rule | Official |
|------|----------|
| Turn rotation | **الفرق تلعب بالدور** |
| Turn owner | **يختار المجال والسؤال** |
| Question visibility | **يظهر السؤال لجميع الفرق** |
| Turn owner | **يجب أن يجيب** |
| Other teams | **يمكن أن تجيب أو تتجاوز** |
| Facilitator | Sees answers **before** audience |
| After reveal | All screens return to **board centrally** |

**Scoring mapping for outcomes:**

| Outcome | Maps to |
|---------|---------|
| Turn owner correct | Owner team — correct row |
| Turn owner wrong | Owner team — wrong row |
| Turn owner no answer / timeout | Owner team — wrong or no answer row |
| Other team correct | Other teams — correct row |
| Other team wrong | Other teams — wrong row |
| Other team no answer / pass (تجاوز) | Other teams — no answer (**0**) |

---

## 7. Official scoring table

Points apply per question, by **difficulty of the question cell** (easy / medium / hard).

### 7.1 Owner team (الفريق صاحب الدور)

| Difficulty | Correct | Wrong or no answer |
|------------|---------|---------------------|
| **Easy** | **+15** | **−5** |
| **Medium** | **+30** | **−10** |
| **Hard** | **+45** | **−15** |

### 7.2 Other teams (باقي الفرق)

| Difficulty | Correct | No answer | Wrong |
|------------|---------|-----------|-------|
| **Easy** | **+5** | **0** | **−5** |
| **Medium** | **+10** | **0** | **−10** |
| **Hard** | **+15** | **0** | **−15** |

### 7.3 Combined reference matrix

| Role | Difficulty | ✓ Correct | ✗ Wrong | — No answer / pass |
|------|------------|-----------|---------|---------------------|
| Owner | Easy | +15 | −5 | −5 |
| Owner | Medium | +30 | −10 | −10 |
| Owner | Hard | +45 | −15 | −15 |
| Other | Easy | +5 | −5 | 0 |
| Other | Medium | +10 | −10 | 0 |
| Other | Hard | +15 | −15 | 0 |

### 7.4 Negative scoring rules

- Wrong answers apply **negative** `pointsDelta` per table above (both owner and other teams).
- Owner **no answer** uses the same penalty as owner **wrong** for that difficulty.
- Other team **no answer** or **pass** = **0** (no penalty, no reward).
- `stageScores.stage3` and `totalScore` decrease on negative deltas (confirm floor policy at implementation if scores must not go below 0).

### 7.5 Maximum possible score (derived)

**Per single question (theoretical caps):**

| Role | Best case | Worst case (answered wrong) |
|------|-----------|----------------------------|
| Owner | +45 (hard, correct) | −15 (hard, wrong/no answer) |
| Other | +15 (hard, correct) | −15 (hard, wrong) |

**Stage maximum for one team** depends on how many times that team is turn owner and how often it answers other teams’ questions. It is **not a fixed constant** in the rulebook.

Example bound (illustrative only): if a team were owner on 8 hard questions (all correct) and answered 22 other hard questions correctly:  
(8 × 45) + (22 × 15) = **690** — actual totals depend on turn count, field mix, and participation.

**Full board if every question played once:** 30 question events × multiple teams scoring per event — stage totals are per-team sums, not a single global cap.

---

## 8. Official `gameFlow` statuses (master doc §6 — reference only)

These exist in the official document; Sprint 4.1 may add types but **does not implement** full flow yet:

`stage3_intro` → `stage3_board` → `stage3_question_open` → `stage3_reveal` → `stage3_finished`

---

## 9. Comparison — official rules vs current project

**Project:** `codex-master-prompt-v1-sufaraa-al` · Stage 1/2 Frozen v1 · Stage 3 **not built**

### 9.1 What matches (partial / schema only)

| Item | Status |
|------|--------|
| `stageScores.stage3` field reserved | ✅ Schema |
| `progress.stage3SelectedQuestionId` reserved | ✅ Schema |
| `readiness.stage3` reserved | ✅ Schema |
| Facilitator-driven `gameFlow` pattern (Stages 1–2) | ✅ Pattern to extend |
| Firestore answer + confirm pattern (Stages 1–2) | ✅ Pattern to extend |

### 9.2 What does not match

| Official rule | Current project |
|---------------|-----------------|
| Name **على المحك** | ❌ `gameflow-copy.ts` says **اكتشفوا الطريق** |
| 5-of-6 fields, 30-question board | ❌ Not implemented |
| 6 Q/field (2+2+2 difficulty) | ❌ Not implemented |
| Turn rotation + owner selection | ❌ Not implemented |
| Timers 15 / 20 / 10 s | ❌ No `stage3` timer; no selection/reveal purposes |
| Owner scoring (+15/+30/+45, penalties) | ❌ Not implemented |
| Other-team scoring (+5/+10/+15, penalties, pass=0) | ❌ Not implemented |
| Facilitator preview before audience reveal | ❌ Not implemented |
| Central board return after reveal | ❌ Not implemented |
| Official Stage 3 statuses (board, question_open, reveal, finished) | ❌ Only `stage3_intro` in types |
| `features/stage3/` module | ❌ Does not exist |
| Facilitator Stage 3 flow buttons | ❌ Jumps `stage2_finished` → `final_results` |
| Stage 3 audience screens | ❌ Placeholder only |
| Stage 3 mock question bank | ❌ None |
| `visibleToAudience` / reveal gating | ❌ Not implemented for Stage 3 |

### 9.3 Missing summary (checklist)

- [ ] Correct stage name in all copy
- [ ] Official GameFlow status types
- [ ] Stage 3 facilitator flow path (intro → … → finished)
- [ ] Board UI + 5×6 question grid
- [ ] Turn owner selection
- [ ] Central timers (selection / answer / reveal)
- [ ] Team confirm answer flow for owner + others
- [ ] Scoring engine with official table
- [ ] Reveal + audience gradual display
- [ ] Facilitator progress / answer preview
- [ ] Mock or imported question bank (30 cells)

---

## 10. Proposed Sprint 4.1 — Stage 3 foundation (no gameplay engine)

**Goal:** Align project shell, types, copy, and documentation with official rules. **No** scoring transactions, **no** board gameplay, **no** changes to Frozen Stage 1/2 logic.

### 10.1 In scope

| # | Deliverable | Acceptance |
|---|-------------|------------|
| 1 | **`docs/stage3-official-rules.md`** | This document — source of truth for Stage 3 rules |
| 2 | **Rename copy** | `gameflow-copy.ts`: Stage 3 → **على المحك**; remove ~~اكتشفوا الطريق~~ |
| 3 | **Extend `GameFlowStatus`** | Add: `stage3_board`, `stage3_question_open`, `stage3_reveal`, `stage3_finished` |
| 4 | **Extend timer types** | `CompetitionTimerStage`: add `"stage3"`; timer `purpose`: add `"selection"`, `"reveal"` |
| 5 | **`stage3-scoring-config.ts`** | Constants only — official table from §7 (no Firestore writes) |
| 6 | **Placeholder screens** | `features/stage3/` intro + minimal placeholders for board / question / reveal / finished |
| 7 | **Shell wiring** | `TeamShell`, `AudienceShell`, `FacilitatorShell` — route new statuses to placeholders |
| 8 | **Facilitator flow buttons** | After `stage2_finished`: شرح / بدء / إنهاء المرحلة الثالثة; insert before `final_results` |
| 9 | **`finishStage3()`** | Sets `stage3_finished`, stops timer — mirror Stage 1/2 finish pattern |
| 10 | **`docs/stage3-sprint-4.1-foundation.md`** | Checklist + exit criteria for sprint |
| 11 | **Update `project-master-context.md`** | Point to this doc; note scoring table confirmed |

### 10.2 Explicitly out of scope (Sprint 4.2+)

- Turn rotation logic
- Question board selection UI (functional)
- Answer Firestore transactions + scoring
- Timers wired to gameplay guards
- Audience reveal animations
- Question bank (30 questions)
- Stage 2 compliance patches (unique player per field, etc.)

### 10.3 Exit criteria

- Facilitator can walk: `stage3_intro` → `stage3_board` → `stage3_question_open` → `stage3_reveal` → `stage3_finished` (placeholders)
- All roles show **على المحك** — never ~~اكتشفوا الطريق~~
- `stage3-scoring-config.ts` exports official numbers from §7
- `npm run typecheck`, `lint`, `build` pass
- Stage 1/2 regression smoke unchanged

### 10.4 Suggested follow-on sprints (preview only)

| Sprint | Focus |
|--------|-------|
| 4.2 | Mock 30-question bank + board UI + turn owner pick (no scoring) |
| 4.3 | Timers 15/20/10 + team answer UI |
| 4.4 | `confirmStage3Answer` + official scoring table |
| 4.5 | Facilitator preview + reveal + audience |
| 4.6 | Freeze + `docs/stage3-freeze-v1.md` + checklist |

---

*End of Stage 3 official rules. Numeric scoring confirmed via competition plan. No code in this document.*
