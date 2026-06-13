# Stage 3 Rules Extraction Report — اكتشفوا الطريق

> **Date:** 2026-06-03  
> **Task:** Re-open original competition documentation and extract Stage 3 rules.  
> **Code changes:** None (report only).

---

## 1. Sources searched

| Source | Result |
|--------|--------|
| `docs/` in `codex-master-prompt-v1-sufaraa-al` | Stage 1/2 freeze + foundation docs only. **No Stage 3 rules doc.** |
| `docs/stage3-architecture-proposal.md` | **Derived proposal** (Sprint 4.x), not original competition spec |
| `docs/project-master-context.md` | **Derived audit**, explicitly states Stage 3 product spec undefined |
| Root README / `AGENTS.md` / master prompt file | **Not found** in repo |
| `Backup-Stage1-Frozen-v1`, `codex-master-prompt-v1-sufaraa-al-Backup-Sprint-2.4` | Same schema + placeholder labels as early project; **no Stage 3 gameplay text** |
| `types/index.ts`, `firebase/firestore.ts`, `features/gameflow/` | Earliest **canonical schema + labels** |
| `features/stage3/` | **Does not exist** — Stage 3 not implemented |
| Parent `Documents/Codex/` folders (2026-05-16 … 2026-05-30) | **No separate competition rulebook** located |
| Agent transcripts | Sprint user queries for Stage 2; **no original Stage 3 rule paragraph** |

### Critical finding

**There is no original, standalone competition documentation file in this repository that defines Stage 3 gameplay rules, scoring, question count, timing, or audience/team flows.**

The project folder name (`codex-master-prompt-v1-sufaraa-al`) implies an external master prompt existed at project inception, but that prompt was **not committed** to the repo. Everything below labeled **DOCUMENTED** comes from code/schema/labels present from Stage 1 freeze onward. Everything else is **ASSUMPTION** or **INFERENCE**.

---

## 2. Extraction matrix

| Topic | DOCUMENTED | NOT DOCUMENTED (gap) |
|-------|------------|----------------------|
| Stage name | ✅ اكتشفوا الطريق | — |
| Gameplay rules | ❌ | No rules text anywhere |
| Scoring | ❌ | No points value for Stage 3 |
| Question count | ❌ | No count specified |
| Timing | ❌ | No Stage 3 timer duration or type |
| Team flow | ⚠️ Partial | Only `stage3_intro` placeholder + schema hint |
| Audience flow | ❌ | No Stage 3 audience spec |
| Running/finished statuses | ❌ | Only `stage3_intro` in types |
| Answer Firestore format | ❌ | No `stage3_*` answer path in any original doc |
| Facilitator controls | ⚠️ Partial | Status exists in enum; **no facilitator button** in UI |

---

## 3. DOCUMENTED facts (original / canonical sources)

### 3.1 Stage identity

| Fact | Source |
|------|--------|
| Arabic name: **اكتشفوا الطريق** | `features/gameflow/gameflow-copy.ts` (from Backup-Stage1-Frozen-v1 onward) |
| English project context: Stage 3 of **سفراء المسيح** competition | App headers, `access-portal.tsx` |
| Next stage after Stage 3 in lifecycle: **Stage 4 — أكملوا الرسالة** | `gameflow-copy.ts` → `stage4_intro` label |

### 3.2 Competition lifecycle position

From `types/index.ts` → `gameFlowStatuses` (unchanged since Backup-Stage1-Frozen-v1):

```
… → stage2_finished → stage3_intro → stage4_intro → final_results → podium
```

| Fact | Source |
|------|--------|
| `stage3_intro` is a valid `GameFlowStatus` | `types/index.ts` |
| **`stage3_running` and `stage3_finished` do not exist** in original types | `types/index.ts` |
| Facilitator manually advances `gameFlow` (pattern established Stage 1/2) | Stage 1/2 freeze docs + `facilitator-shell.tsx` |
| Stage 2 finish does **not** auto-advance to Stage 3 | `docs/stage2-test-checklist.md` |

### 3.3 UI labels (placeholder era)

From `features/gameflow/gameflow-copy.ts`:

| Status | Team / facilitator label | Audience label |
|--------|--------------------------|----------------|
| `stage3_intro` | مرحلة اكتشفوا الطريق - **سيتم تطويرها لاحقاً** | Same placeholder text |

**Documented meaning:** Stage 3 was **planned but explicitly not built** at foundation time.

### 3.4 Current implementation state (factual)

| Fact | Source |
|------|--------|
| No `features/stage3/` module | Repo tree |
| Team shell: no `stage3_*` branch except fallback placeholder when status is `stage3_intro` | `team-shell.tsx` |
| Audience shell: no Stage 3-specific component | `audience-shell.tsx` |
| Facilitator `gameFlowControls`: **no button** for `stage3_intro` or `stage4_intro`; jumps from `stage2_finished` to `final_results` | `facilitator-shell.tsx` |
| `CompetitionTimerStage` = `"stage1" \| "stage2" \| "none"` only — **no `stage3` timer stage** | `types/index.ts` |
| Documented Stage 1 timer: 420s answering | `facilitator-shell.tsx` + Stage 1 checklist |
| Documented Stage 2 reading timer: 180s | Stage 2 freeze + checklist |
| **No documented Stage 3 timer** | Timer type + facilitator UI |

### 3.5 Firestore schema reservations (original design intent — not gameplay rules)

From `types/index.ts` / `firebase/firestore.ts` initial team state:

| Field | Type / default | What is documented |
|-------|----------------|-------------------|
| `stageScores.stage3` | `number`, `0` | Stage 3 will contribute to total score |
| `readiness.stage3` | `boolean`, `false` | Reserved readiness flag (never wired) |
| `progress.stage3SelectedQuestionId` | `string`, `""` | Reserved progress field; name implies **question selection** |

**What is NOT documented:** how selection works, how many selections, scoring per selection, or when the field is written.

### 3.6 Cross-stage patterns (documented for Stage 1/2 — apply by analogy only)

These are **not Stage 3 rules**, but they are the only documented competition mechanics in the repo:

| Pattern | Stage 1 | Stage 2 | Source |
|---------|---------|---------|--------|
| Correct points | +5 | +15 | Stage 1/2 freeze docs |
| Wrong points | 0 | 0 | Stage 1/2 freeze docs |
| Duplicate answers | Blocked | Blocked | Answer engines + checklists |
| Facilitator ends stage | `stage1_finished` | `stage2_finished` | Freeze docs |
| Finish stops timer | Yes | Yes | `finishStage1` / `finishStage2` |
| Ranking sort | stage score ↓, total ↓, name ↑ | Same for stage2 | Ranking modules |

**Important:** Using +20, tiered paths, or 600s timer for Stage 3 would be **ASSUMPTION**, not extraction from original docs.

---

## 4. INFERENCES from schema (not documented gameplay)

These are reasonable readings of field names — **not facts** until a product owner confirms:

| Inference | Basis | Confidence |
|-----------|-------|------------|
| Stage 3 involves **choosing question(s)** rather than a fixed linear list | `progress.stage3SelectedQuestionId` | Medium — name only |
| Stage 3 is **not** the four-field / role-assignment model of Stage 2 | Different progress shape vs `stage2Field*` | Medium |
| Stage 3 likely needs **its own running/finished statuses** to match Stage 1/2 | Stage 1/2 have intro/running/finished; Stage 3 only has intro in types | High — architectural, not gameplay |
| Stage 4 may use **escalating streak scoring** starting at 15 | `stage4.streak`, `stage4.nextCorrectPoints: 15` | Medium — applies to Stage 4, not Stage 3 |

---

## 5. ASSUMPTIONS (from `docs/stage3-architecture-proposal.md` — NOT original docs)

The following were **proposed in the architecture doc** and must **not** be treated as original competition rules unless an external rulebook confirms them:

| Assumed rule | Proposal value | Status |
|--------------|----------------|--------|
| Gameplay | 3 paths (a/b/c), 3 milestones each, lock path once | **ASSUMPTION** |
| Scoring | +15 / +20 / +25 by path tier | **ASSUMPTION** |
| Wrong answer | 0 | Inferred from Stage 1/2 pattern, not Stage 3 doc |
| Questions per team | 3 (one per milestone) | **ASSUMPTION** |
| Question bank size | 9 total (3×3) | **ASSUMPTION** |
| Question type | Multiple choice only | **ASSUMPTION** |
| Timer | 600s answering, `stage: stage3` | **ASSUMPTION** |
| Statuses | `stage3_running`, `stage3_finished` | **ASSUMPTION** (required for implementation, absent from original types) |
| Answer ID | `stage3_{questionId}_{teamId}` | **ASSUMPTION** |
| Team flow | Path map → milestones → wait for facilitator | **ASSUMPTION** |
| Audience running | Live Stage 3 ranking (like Stage 1) | **ASSUMPTION** |
| Audience intro/finished | Title card + ranking cards | **ASSUMPTION** |
| Facilitator | Progress table + finish handler + timer button | **ASSUMPTION** |
| Ranking | `stageScores.stage3` ↓ → `totalScore` ↓ → name ↑ | Inferred from Stage 1/2 pattern |

---

## 6. Category-by-category extraction

### 6.1 Original gameplay rules

**DOCUMENTED:** None.

**INFERENCE:** Question-selection mechanic suggested by `stage3SelectedQuestionId`.

**ASSUMPTION:** Full path/milestone model in architecture proposal.

---

### 6.2 Original scoring

**DOCUMENTED:**

- `stageScores.stage3` field exists and rolls into `totalScore` (schema only).
- No point value assigned to Stage 3 in any original file.

**ASSUMPTION:** +15/+20/+25 tiered scoring (proposal only).

**Analog (not Stage 3 rule):** Stage 1 = +5, Stage 2 = +15, wrong = 0.

---

### 6.3 Original number of questions

**DOCUMENTED:** None.

**ASSUMPTION:** 3 questions per team, 9 in bank (proposal only).

---

### 6.4 Original timing

**DOCUMENTED:**

- Central timer exists (`competitions/main/system/timer`).
- Timer `stage` enum does **not** include Stage 3.
- No Stage 3 duration documented anywhere.

**ASSUMPTION:** 600s answering timer (proposal only).

---

### 6.5 Original team flow

**DOCUMENTED:**

| Step | Fact |
|------|------|
| When `gameFlow.status === stage3_intro` | Team sees `GameFlowPlaceholder` with label “اكتشفوا الطريق - سيتم تطويرها لاحقاً” |
| Other `stage3_*` statuses | **Do not exist** in original types — team would see placeholder for unknown status or remain on intro |

**NOT DOCUMENTED:** path selection, answering, progress UI, finished screen.

**ASSUMPTION:** Full running flow in architecture proposal.

---

### 6.6 Original audience flow

**DOCUMENTED:**

| Status | Audience behavior |
|--------|-------------------|
| `stage3_intro` | Generic placeholder via `audienceGameFlowLabels` — same “سيتم تطويرها لاحقاً” text |
| Any other Stage 3 status | N/A — statuses not defined |

**NOT DOCUMENTED:** live ranking, progress messaging, finished results for Stage 3.

**ASSUMPTION:** `AudienceStage3Running` / `AudienceStage3Finished` in proposal.

---

## 7. Comparison: original vs proposal vs implemented

| Dimension | Original (repo facts) | Architecture proposal | Implemented |
|-----------|----------------------|------------------------|-------------|
| Name | اكتشفوا الطريق | Same | Placeholder label only |
| Statuses | `stage3_intro` only | + running + finished | intro placeholder only |
| Gameplay | Undefined | Path + 3 milestones | None |
| Scoring | Field reserved, no values | Tiered 15/20/25 | None |
| Questions | Undefined | 3 per team / 9 bank | None |
| Timing | No Stage 3 timer type | 600s answering | None |
| Team UI | Placeholder | Full flow | Placeholder |
| Audience UI | Placeholder | Ranking views | Placeholder |
| Facilitator | No Stage 3 button | 3 buttons + table | Skips to final_results |
| Answers | No path format | `stage3_{questionId}_{teamId}` | None |

---

## 8. What would count as “original documentation”

To replace assumptions, locate or add **one** authoritative source outside this repo, for example:

- Original master prompt / product brief (not in git)
- Excel question bank spec for Stage 3
- Written competition rulebook from organizers
- Facilitator runbook (Arabic)

Until then, Stage 3 implementation should treat:

1. **Schema + lifecycle + name** as fixed facts.  
2. **Stage 1/2 patterns** as engineering conventions, not Stage 3 rules.  
3. **Architecture proposal** as a draft requiring sign-off.  
4. **`stage3SelectedQuestionId`** as the strongest hint that gameplay involves **question selection** — details TBD.

---

## 9. Recommended next step (process, not code)

1. Obtain external original rulebook or facilitator script for **اكتشفوا الطريق**, if it exists outside the repo.  
2. Run a **15-minute product sign-off** on: question selection model, count, scoring, timer, audience visibility.  
3. Update `docs/stage3-architecture-proposal.md` §10 “Open decisions” with confirmed answers.  
4. Only then start Sprint 4.1 implementation.

---

## 10. Source index

| ID | Path | Role |
|----|------|------|
| S1 | `types/index.ts` | Canonical schema + status enum |
| S2 | `firebase/firestore.ts` | Initial team state defaults |
| S3 | `features/gameflow/gameflow-copy.ts` | Arabic status labels |
| S4 | `features/facilitator/components/facilitator-shell.tsx` | Facilitator flow buttons + timers |
| S5 | `features/team/components/team-shell.tsx` | Team routing |
| S6 | `features/audience/components/audience-shell.tsx` | Audience routing |
| S7 | `docs/stage1-freeze-v1.md` | Stage 1 documented rules (cross-reference only) |
| S8 | `docs/stage2-freeze-v1.md` | Stage 2 documented rules (cross-reference only) |
| S9 | `Backup-Stage1-Frozen-v1/types/index.ts` | Earliest committed schema (same Stage 3 placeholders) |
| S10 | `docs/stage3-architecture-proposal.md` | **Derived — assumptions** |
| S11 | `docs/project-master-context.md` | **Derived — audit** |

---

*End of Stage 3 Rules Extraction Report.*
