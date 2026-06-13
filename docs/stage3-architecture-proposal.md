# Stage 3 Architecture Proposal — على المحك

> **Status:** Proposal only — no implementation in this document  
> **Date:** 2026-06-03 (revised against official master doc)  
> **Authoritative source:** `Sufaraa-Al-Maseeh-Master-Documentation-v1.pdf` (v1.0) — §10 المرحلة الثالثة  
> **Local copy:** `C:\Users\ASUS\Downloads\Sufaraa-Al-Maseeh-Master-Documentation-v1\Sufaraa-Al-Maseeh-Master-Documentation-v1.md`  
> **Constraints:** Stage 1 and Stage 2 remain **Frozen v1** — no changes to frozen modules unless compliance patch is approved

---

## Naming correction

| Wrong (legacy in repo) | Official (PDF v1.0) |
|------------------------|---------------------|
| اكتشفوا الطريق | **على المحك** |

Remove **اكتشفوا الطريق** from all Stage 3 documentation and UI copy when implementation begins. The wrong name appears today in `gameflow-copy.ts` and older docs only.

---

## Rule classification legend

| Label | Meaning |
|-------|---------|
| **OFFICIAL** | Stated in master documentation PDF v1.0 §10 (and related §6, §14, §18) |
| **NOT IN PDF** | Requested detail absent from official v1.0 text — do not invent values |
| **IMPLEMENTATION GAP** | Difference between official spec and current codebase |
| **PROPOSAL** | Engineering plan for Sprint 4 — must not contradict OFFICIAL rules |

---

## §1 — Official Stage 3 rules (PDF v1.0 only)

Source: Master doc **§10 المرحلة الثالثة - على المحك**, **§6 GameFlow statuses**, **§14 شاشة الجمهور**, **§18 المؤقتات المركزية**, **§19 نظام الإجابات**.

### 1.1 Stage identity

| Item | OFFICIAL value |
|------|----------------|
| Arabic name | **على المحك** |
| Concept | Strategic stage based on choosing questions by **field the team masters** |
| Stage order | Third of four: اجمعوا الكنوز → فتشوا الكتب → **على المحك** → اثبتوا بالحق |

### 1.2 Fields (المجالات)

Six possible fields; **5 are selected** per competition settings:

| # | Field (Arabic) | English gloss |
|---|----------------|---------------|
| 1 | شخصيات | Characters |
| 2 | معجزات | Miracles |
| 3 | أمثال | Parables |
| 4 | زمان ومكان | Time and place |
| 5 | أعداد | Numbers |
| 6 | أقوال | Sayings |

**Selection rule:** 5 of 6 fields — configured in competition settings (not hard-coded in app).

### 1.3 Question counts and difficulty

| Item | OFFICIAL value |
|------|----------------|
| Questions per field | **6** |
| Easy per field | **2** (سهل) |
| Medium per field | **2** (متوسط) |
| Hard per field | **2** (صعب) |
| Bank size (5 active fields) | **30 questions** (5 × 6) when all fields active |

### 1.4 Timers (default durations)

Central timer only — facilitator/system writes; all screens read (§18).

| Phase | Arabic | OFFICIAL duration | Timer `purpose` (§18) |
|-------|--------|-------------------|------------------------|
| Question selection | اختيار السؤال | **15 seconds** | `selection` |
| Answering | الإجابة | **20 seconds** | `answering` |
| Announcement / reveal | الإعلان / reveal | **10 seconds** | `reveal` |

Configurable via settings (§13 تبويب الإعدادات — تعديل المؤقتات).

### 1.5 Gameplay flow (OFFICIAL)

1. Teams play **in turn** (الفرق تلعب بالدور).
2. **Turn owner team** chooses **field and question** (الفريق صاحب الدور يختار المجال والسؤال).
3. Question is shown to **all teams** (يظهر السؤال لجميع الفرق).
4. Turn owner team **must answer** (يجب أن يجيب).
5. Other teams **may answer or pass** (يمكن أن تجيب أو تتجاوز حسب قواعد المرحلة) — pass/answer policy details **NOT IN PDF** beyond this sentence.
6. Facilitator sees answers **before** audience display (الميسر يرى الإجابات مباشرة قبل عرضها للجمهور).
7. After reveal, all screens return to the **board centrally** via `gameFlow` — not audience-only navigation (§10 emphasis).
8. Answers use two-step confirm (§19): select → confirm; no edit after confirm.
9. Audience must not see answers before reveal (`visibleToAudience` / reveal state — §19, §14).

### 1.6 Official `gameFlow.status` values for Stage 3 (§6)

| Status | Role |
|--------|------|
| `stage3_intro` | Stage explanation |
| `stage3_board` | Board / field grid — turn selection |
| `stage3_question_open` | Active question visible to teams |
| `stage3_reveal` | Announcement — gradual audience reveal |
| `stage3_finished` | Stage end |

**NOT OFFICIAL:** `stage3_running` (used in earlier draft proposals).

Lifecycle segment:

```
stage2_finished → stage3_intro → stage3_board ⇄ stage3_question_open → stage3_reveal → stage3_board → … → stage3_finished → stage4_intro
```

### 1.7 Scoring (OFFICIAL — partial)

| Topic | OFFICIAL statement |
|-------|-------------------|
| Configurability | **نظام النقاط يجب أن يكون قابلا للإعداد لأن جدول النقاط قد يتغير لاحقا** |
| Scoring table | **NOT IN PDF v1.0** |
| Owner team (turn team) correct/wrong points | **NOT IN PDF v1.0** |
| Other teams correct/wrong points | **NOT IN PDF v1.0** |
| Wrong answer penalties | **NOT IN PDF v1.0** |

**Do not implement numeric scoring** until a signed scoring table is added to settings or an updated official doc. Engine must read from `competitions/main/system/settings` (or equivalent) per §15.

### 1.8 Audience display (OFFICIAL — §14)

During active stages:

- Show **current stage points only** — not cumulative total (§14, §28).
- Do **not** show answers before announcement time (§14).
- Stage 3 and 4: show team answers **gradually at reveal** (§14).
- After stage finish: show general results progressively (§28).

During `stage3_board` / `stage3_question_open`: timer when applicable; no admin data; no early answers.

### 1.9 Firestore hints from master doc (§15–§17)

| Path | Relevance to Stage 3 |
|------|----------------------|
| `system/gameFlow` | Status + turn + active question |
| `system/timer` | selection / answering / reveal phases |
| `system/settings` | Field count (5 of 6), timers, **scoring table (TBD)** |
| `system/currentQuestion` | Active question document |
| `teamStates/{teamId}` | `stageScores.stage3`, `progress.stage3SelectedQuestionId` |
| `answers/{answerId}` | `visibleToAudience`, `pointsDelta`, `isCorrect` |

---

## §2 — Stage 1 & Stage 2 compliance audit (vs official PDF)

Summary for pre–Stage 3 planning. Full detail in `docs/project-master-context.md` §10.

### 2.1 Stage 1 — اجمعوا الكنوز (§8)

| Rule | Official | App (Frozen v1) | Match? |
|------|----------|-----------------|--------|
| Name | اجمعوا الكنوز | Same | ✅ |
| Timer | 7 minutes | 420 s | ✅ |
| Points correct | +5 | +5 | ✅ |
| Wrong answer | No penalty | 0 | ✅ |
| Max score | 250 (50 × 5) | Theoretically yes; mock bank = 6 | ⚠️ mock only |
| Max questions | 50 | 6 mock | ⚠️ mock only |
| Sequential auto-advance after confirm | Yes | Yes (~850 ms) | ✅ |
| No result shown to team during play | Yes | Yes (no correct/wrong UI) | ✅ |
| Audience: stage ranking + timer, no total | Yes | Audience table shows stage score only | ✅ |
| Facilitator: stage + total + current Q per team | Yes | Ranking table includes total + question index | ✅ |
| Question types | missing / MC / arrange / blanks later | missing + MC + arrange | ⚠️ partial types |

### 2.2 Stage 2 — فتشوا الكتب (§9)

| Rule | Official | App (Frozen v1) | Match? |
|------|----------|-----------------|--------|
| Name | فتشوا الكتب | Same | ✅ |
| Four fields / roles | Same four | Same four | ✅ |
| Unique player per field | **Required** | **Not enforced** in UI | ❌ |
| Reading timer | 3 minutes | 180 s | ✅ |
| Per-field play timer | **2.5 min each field** | **Not implemented** | ❌ |
| Questions per field | 5 | 5 mock | ✅ |
| Points correct | +15, no penalty | +15, 0 wrong | ✅ |
| Max score | 300 | Possible; mock only | ⚠️ |
| `gameFlow` per-field statuses | `stage2_field_*` | Single `stage2_player_turns` | ❌ |
| Role assignment step | Implied before reading | `stage2_role_assignment` | ✅ (extra status OK) |
| Field order | Fixed sequence in PDF | Fixed in `stage2-field-sequence.ts` | ✅ |
| Audience: stage ranking + timer | Yes | Partial (reading sync; player turns placeholder) | ⚠️ |

### 2.3 Compliance patches recommended before Stage 3

These are **product/engineering fixes** — not Stage 3 scope — but reduce spec drift:

| Priority | Patch | Rationale |
|----------|-------|-----------|
| P0 | Rename Stage 3 labels **اكتشفوا الطريق → على المحك** | Wrong name in repo |
| P0 | Extend `GameFlowStatus` with official Stage 3 statuses | §6 list differs from types |
| P1 | Stage 2: block same player on two fields | §9 explicit rule |
| P1 | Stage 2: per-field `gameFlow` statuses or documented exception | Official §6 |
| P2 | Stage 2: 150 s answering timer per field | Official §9 timing |
| P2 | Timer `purpose`: add `selection`, `reveal` | Required for Stage 3 |
| P2 | `system/settings` doc for Stage 3 fields + scoring | Official §15 |
| P2 | Answer `visibleToAudience` + reveal gating | Official §19 / §14 |
| P3 | Stage 4 name **أكملوا الرسالة → اثبتوا بالحق** in copy | §6 / §11 naming |
| P3 | Stage 1 question bank scale (50) | Content pipeline, not blocker |

**Frozen v1 note:** Stage 1/2 logic changes require explicit compliance-patch approval — not silent edits.

---

## §3 — Architecture proposal (aligned to OFFICIAL §10)

This section proposes **how to implement** official rules. It adds no numeric scoring.

### 3.1 Core model

- **Board state (`stage3_board`):** Shows 5 active fields × 6 question slots (2/2/2 by difficulty). Highlights turn owner. Turn owner selects field + question cell → transition to `stage3_question_open`.
- **Question open (`stage3_question_open`):** All teams see question. Timers: selection already consumed on board; **20 s answering** on `purpose: answering`. Turn owner must submit; others submit or pass (pass UX **TBD — NOT IN PDF**).
- **Reveal (`stage3_reveal`):** **10 s** `purpose: reveal`. Facilitator preview already done. Audience gradual reveal. Then `gameFlow` → `stage3_board` centrally.
- **Turn rotation:** Stored on `gameFlow` (e.g. `currentTurnTeamId`, turn index) — facilitator may advance turn per official “بالدور” rule.

### 3.2 Team experience

| Status | Screen (proposed) |
|--------|-------------------|
| `stage3_intro` | Rules + field list (5 of 6) |
| `stage3_board` | Waiting or selecting (if turn owner) |
| `stage3_question_open` | Question card + confirm (§19) |
| `stage3_reveal` | Result/wait — no edit |
| `stage3_finished` | Stage score + wait for facilitator |

**Turn owner selection:** Only turn owner writes field+question choice to `gameFlow` (or facilitator confirms pick — **PROPOSAL:** owner team UI writes selection; facilitator can override in Control tab per §13).

**`progress.stage3SelectedQuestionId`:** Mirror of active question for team UI highlight (schema already reserved).

### 3.3 Facilitator experience

| Tab / panel | Behavior |
|-------------|----------|
| Flow | Buttons: intro → board → finish; advance question_open ↔ reveal ↔ board |
| Board view | 5×6 grid, turn indicator, consumed questions |
| Live answers | Read `answers` before setting `stage3_reveal` |
| Timer | Start selection (15 s) / answering (20 s) / reveal (10 s) |
| Settings link | 5-of-6 fields, scoring table when defined |

### 3.4 Audience experience (OFFICIAL constraints)

| Status | Display |
|--------|---------|
| `stage3_intro` | Stage title **على المحك** |
| `stage3_board` | Stage name + timer if selection active + **stage 3 ranking only** |
| `stage3_question_open` | Timer; **no question text if policy = no spoilers** (confirm with organizers — PDF silent on question visibility during open) |
| `stage3_reveal` | Gradual team answers + score deltas **when scoring table exists** |
| `stage3_finished` | Stage 3 results; cumulative total per §28 post-stage rules |

### 3.5 Scoring engine (blocked on settings)

When scoring table is published:

```ts
// Pseudocode — values come from settings, NOT hard-coded
pointsDelta = scoreStage3({
  isTurnOwner: teamId === gameFlow.currentTurnTeamId,
  isCorrect,
  difficulty: "easy" | "medium" | "hard",
  answeredAs: "owner" | "other" | "pass",
  settings: system.settings.stage3Scoring,
});
```

Until `stage3Scoring` exists in settings: implement flow without point writes or use facilitator-only manual scoring (§13 تعديل النقاط + auditLogs).

### 3.6 Answer documents (proposal)

**ID:** `stage3_{questionId}_{teamId}`

| Field | Notes |
|-------|-------|
| `stage` | `"stage3"` |
| `questionId` | Board cell id |
| `field` | One of six field keys |
| `difficulty` | easy / medium / hard |
| `isTurnOwner` | boolean |
| `answer` | string or `"pass"` if supported |
| `confirmed` | true after confirm |
| `isCorrect` | boolean |
| `pointsDelta` | from settings table |
| `visibleToAudience` | false until reveal |

### 3.7 Type system changes (proposal)

Add to `GameFlowStatus`:

- `stage3_board`
- `stage3_question_open`
- `stage3_reveal`
- `stage3_finished`

Add to `CompetitionTimerStage`: `"stage3"`.

Add timer purposes: `"selection" | "reveal"` (plus existing `"answering"`, `"reading"`).

**Remove from prior drafts:** `stage3_running`, path/milestone model, team path lock fields.

---

## §4 — Sprint roadmap (revised)

| Sprint | Scope |
|--------|-------|
| 4.0 | Compliance: rename على المحك; official status enum; settings stub |
| 4.1 | Shells + flow buttons for `stage3_intro` / `stage3_board` / `stage3_finished` placeholders |
| 4.2 | Board UI + turn owner selection + `gameFlow` writes |
| 4.3 | Question open + confirm + answering timer (20 s) |
| 4.4 | Reveal flow + `visibleToAudience` + audience gradual reveal |
| 4.5 | Scoring from settings — **only after scoring table signed** |
| 4.6 | Freeze + checklist |

---

## §5 — Open items (NOT IN PDF v1.0)

| # | Item | Action |
|---|------|--------|
| 1 | Full scoring table | Obtain from organizers; store in `system/settings` |
| 2 | Owner vs other team point values | Same |
| 3 | Wrong answer penalties | Same |
| 4 | Pass rules for non-owner teams | Clarify “تتجاوز” behavior |
| 5 | Show question on audience during `question_open` | Product decision |
| 6 | Which 5 of 6 fields for `main` competition | Settings per event |

---

## §6 — Success criteria for Stage 3 Freeze v1

- [ ] Official name **على المحك** everywhere
- [ ] Official statuses implemented (`board`, `question_open`, `reveal`, `finished`)
- [ ] 5 fields × 6 questions (2/2/2 difficulty) configurable
- [ ] Timers: 15 s selection, 20 s answer, 10 s reveal
- [ ] Turn-based field+question selection by owner team
- [ ] All teams see question; owner must answer; others answer/pass per clarified rule
- [ ] Facilitator preview before reveal; central return to board
- [ ] Scoring from settings table (when provided) — no hard-coded guesses
- [ ] Audience rules §14 satisfied
- [ ] Stage 1/2 frozen modules untouched except approved compliance patches

---

*End of Stage 3 Architecture Proposal. Authoritative gameplay text: master PDF §10. Scoring numerics intentionally omitted — not defined in v1.0.*
