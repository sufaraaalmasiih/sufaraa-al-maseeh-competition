# Stage 1 Compliance Repair — اجمعوا الكنوز

> **Sprint:** B — Stage 1 Compliance Repair  
> **Date:** 2026-06-06  
> **Scope:** Stage 1 gameplay only (no Stage 2–4, auth, routing, or competition reset changes)

## Sources

| Source | Role |
|--------|------|
| `Sufaraa-Al-Maseeh-Master-Documentation-v1.pdf` §8 | Official rules (50 Q max, +5/0, question types, blessing message) |
| `sufaraa-v9-6-75-contestant-gameflow-router-fix` | Gameplay reference (tap-order arrange, typed gaps, instant Q50 wait) |
| `docs/stage1-freeze-v1.md` | Frozen engine baseline (Firestore paths, scoring guards) |

---

## What was wrong (audit)

| Issue | Before |
|-------|--------|
| Question types | `arrange` rendered as single MC pick; `missing`/`fill_blank` not typed |
| Arrange | No tap-to-order; broken single-option behavior |
| Transition | ~850ms delay; double timeout in some paths (~700ms effective) |
| End of bank | Empty state while still `stage1_running`; blessing only on `stage1_finished` |
| Question bank | Hard-coded 6 mocks; no 50-question structure |
| Blessing copy | Did not match PDF/old wording |

---

## What was fixed

| Area | Fix |
|------|-----|
| **Multiple choice** | `Stage1ChoiceQuestionCard` — select + confirm (unchanged pattern, dedicated component) |
| **ماذا ينقص / فراغات** | `Stage1TextQuestionCard` — typed input + confirm |
| **رتّب** | `Stage1ArrangeQuestionCard` — tap-to-order on shuffled parts; pipe-separated submit; index-based picks for duplicate labels |
| **Arrange grading** | `stage1-arrange.ts` + `evaluateStage1Answer` — compare normalized pipe string to `correctOrder` |
| **Transition** | `STAGE1_MID_QUESTION_ADVANCE_MS = 300`; brief “تم تأكيد” then advance; no double timeout |
| **End of bank** | `Stage1BlessingWaitScreen` when index ≥ bank count while `stage1_running` (facilitator still sets `stage1_finished`) |
| **Question bank** | `stage1-question-bank.ts` — `getStage1QuestionCount()` caps at 50; mock array swappable |
| **Scoring** | `confirm-stage1-answer.ts` unchanged: +5/0, transaction, duplicate + timer guards |

---

## Supported question types

| Type | Arabic label | UI | Grading |
|------|--------------|-----|---------|
| `multiple_choice` | اختر من متعدد | Option buttons + تأكيد | Normalized string match |
| `missing` | ماذا ينقص | Text input + تأكيد | Normalized string match |
| `fill_blank` | فراغات | Text input + تأكيد | Normalized string match |
| `arrange` | رتّب | Tap parts in order + تأكيد الترتيب | Pipe-joined order vs `correctOrder` |

Normalization: Arabic diacritics stripped, alef/ta/ya unified, whitespace collapsed (`stage1-answer-validation.ts`).

---

## Key files

| File | Purpose |
|------|---------|
| `features/stage1/stage1-question-bank.ts` | Bank accessor (50-cap) |
| `features/stage1/stage1-mock-questions.ts` | Dev mock data (6 questions, all types) |
| `features/stage1/stage1-constants.ts` | Advance delays, official max, pipe separator |
| `features/stage1/stage1-arrange.ts` | Seeded shuffle, order helpers |
| `features/stage1/stage1-answer-validation.ts` | Normalization + correctness |
| `features/stage1/components/stage1-running-screen.tsx` | Flow, transitions, blessing trigger |
| `features/stage1/components/stage1-*-question-card.tsx` | Per-type UI |
| `features/stage1/components/stage1-blessing-wait-screen.tsx` | Auto end-of-bank wait |
| `features/stage1/confirm-stage1-answer.ts` | Firestore transaction (frozen) |

---

## Remaining limitations

- **Mock bank only (6 questions)** — structure supports 50; full import not in this sprint.
- **Excel / admin upload** — not implemented (`docs/stage1-question-bank-audit.md` migration path).
- **Stage timer** — facilitator must start 420s timer manually.
- **Facilitator `stage1_finished`** — still required for official stage end / audience transition; team blessing is automatic when bank completes.
- **Question mix** — official 50-question type cycle from old `getStage1Plan` not applied to mocks (dev bank hand-picks types).

---

## Manual test checklist

### Setup

- [ ] `npm run dev` — app on `http://localhost:3000`
- [ ] Competition reset (facilitator → settings)
- [ ] Facilitator: `stage1_intro` → `stage1_running`
- [ ] Facilitator: start Stage 1 timer (optional)
- [ ] Team logged in on `/team`

### Question types

- [ ] **MC** (Q3): select option → تأكيد → brief feedback → next question (~300ms)
- [ ] **ماذا ينقص** (Q1): type answer → تأكيد
- [ ] **فراغات** (Q2): type blank → تأكيد
- [ ] **رتّب** (Q5–Q6): tap all parts in order → تأكيد الترتيب; wrong order scores 0, correct +5

### Arrange edge cases

- [ ] Shuffled display — can confirm when taps match `correctOrder` (even if display order looks correct)
- [ ] إعادة الترتيب clears picks
- [ ] Duplicate word labels (if present in bank) — index-based picks work

### Scoring guards

- [ ] Correct answer → +5 on `teamStates.stage1`
- [ ] Wrong answer → 0
- [ ] Re-submit same question → duplicate blocked (no extra points)
- [ ] Refresh after answer → same question index; cannot re-score

### End of bank

- [ ] After Q6 confirm → **أحسنتم!** + **لقد أنهيتم مرحلة اجمعوا الكنوز** + **بانتظار توجيه الميسر**
- [ ] `gameFlow.status` still `stage1_running` (team does not see more questions)
- [ ] Facilitator sets `stage1_finished` → team sees official finished screen

### Rankings

- [ ] Facilitator Stage 1 ranking table updates after answers
- [ ] Audience ranking updates during `stage1_running`

### Build

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`

---

## Freeze note

Per `docs/stage1-freeze-v1.md`, Stage 1 engine paths are frozen. This sprint is an **approved gameplay-compliance exception** — UI/interaction and bank structure only; `confirm-stage1-answer.ts` scoring transaction unchanged.
