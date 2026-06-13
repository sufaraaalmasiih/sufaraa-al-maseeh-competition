# Competition Reset — Sprint Reset 1.0

> **Feature:** إعادة تعيين المسابقة (testing)  
> **Competition ID:** `main`  
> **Code:** `features/gameflow/competition-reset.ts`, `features/gameflow/components/competition-reset-panel.tsx`

---

## Purpose

Allow facilitators and super admins to return the live competition to a **clean test state** without deleting registered teams or staff accounts.

---

## What gets reset

| Area | Firestore path | Action |
|------|----------------|--------|
| **Answers** | `competitions/main/answers/*` | **Delete all documents** (Stage 1, 2, 3) |
| **Team states** | `competitions/main/teamStates/{teamId}` | **Replace** with `buildInitialTeamStateDocument()` |
| **Game flow** | `competitions/main/system/gameFlow` | **Replace** — `waiting_players`, cleared Stage 3 board |
| **Timer** | `competitions/main/system/timer` | **Replace** — inactive, zero durations |

### Team state fields cleared

- `totalScore`, all `stageScores.*`
- `progress.*` (Stage 1 index, Stage 2 field/question, Stage 3 selection)
- `stage2Roles` (assignments + lock removed via full document replace)
- `stage4.streak`, `stage4.nextCorrectPoints`
- `ready`, `readiness.*`

### Game flow fields cleared

- `status` → `waiting_players`
- `currentStage` → `none`
- `currentQuestion` → `0`
- `stage3ActiveQuestion` → `null`
- `stage3OpenedQuestionIds` → `[]`
- `stage3UsedQuestionIds` → `[]`
- `stage3OwnerTeamId` / `stage3OwnerTeamName` → `null`

### Timer fields reset

- `active` → `false`
- `remainingSeconds` → `0`
- `stage` → `none`
- `purpose` → `none`
- `durationSeconds`, `startedAtMs`, `endsAtMs` → `0`

---

## What is preserved

| Path | Preserved data |
|------|----------------|
| `teams/{uid}` | Registration: `teamName`, `governorate`, `email`, `players`, etc. |
| `users/{uid}` | Facilitator / admin / viewer profiles |
| Firebase Auth | All accounts |

**Not deleted:** `teams`, `users`, or Auth users.

---

## UI access

| Route | Role | Location |
|-------|------|----------|
| `/facilitator` | `facilitator`, `super_admin` | Tab **الإعدادات** → إعادة تعيين المسابقة |
| `/admin` | `super_admin` | Card below admin shortcuts |

### Confirmation dialog (Arabic)

- تحذير + consequences
- **إلغاء** / **تأكيد إعادة التعيين**
- Loading: **جاري إعادة التعيين...**

### Toasts

- Success: **تمت إعادة تعيين المسابقة بنجاح**
- Failure: **فشلت إعادة التعيين، حاول مرة أخرى**

---

## Reset order (safety)

1. Delete **all** answer documents (batched, max 500 ops per batch).
2. Reset **all** `teamStates` documents (batched sets).
3. Only then replace `gameFlow` and `timer` (parallel `setDoc`).

If step 1 or 2 throws, `gameFlow` and `timer` are **not** updated.

---

## Safety notes

- **Irreversible** — no undo; confirm dialog required.
- **Not atomic across collections** — if step 2 fails mid-batch, some `teamStates` may be reset while others are not; step 3 will not run. Re-run reset or fix in Console.
- If step 1 fails after partial deletes, some answers may remain; re-run reset.
- Requires Firestore **write** permission for facilitator/admin client rules.
- **Production:** restrict to trusted operators; consider a callable Cloud Function with Admin SDK for stricter control later.

---

## Testing instructions

### Prerequisites

- `npm run dev` from `codex-master-prompt-v1-sufaraa-al`
- Facilitator or super_admin login
- At least one registered team with `teamStates` doc

### Runtime test

1. Run Stages 1–3 far enough to create scores and answers.
2. Open `/facilitator` → **الإعدادات** (or `/admin`).
3. Click **إعادة تعيين المسابقة** → **تأكيد إعادة التعيين**.
4. Verify in Firebase Console:
   - `competitions/main/answers` — empty
   - Each `teamStates` — scores `0`, progress reset
   - `gameFlow.status` — `waiting_players`
   - `timer.active` — `false`
   - `teams` and `users` — unchanged
5. Hard-refresh team tabs; confirm Stage 1 starts at question 0 with no duplicate-answer block.

### Build verification

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Related docs

- `docs/testing-and-reset-audit.md` — manual Console reset (pre-feature)
- `firebase/firestore.ts` — `buildInitialTeamStateDocument()`, `MAIN_COMPETITION_ID`
