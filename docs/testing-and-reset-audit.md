# Testing and Reset Audit

> **Document type:** Testability audit + manual reset runbook + proposed Competition Reset feature  
> **Date:** 2026-06-03  
> **Competition ID:** `main` (hardcoded as `MAIN_COMPETITION_ID` in app code)  
> **No code changes** in this audit.

---

## Executive summary

The app persists **all gameplay state in Firestore**. Changing facilitator flow buttons alone does **not** clear scores, answers, question progress, Stage 3 board usage, or duplicate-answer guards.

**There is no “reset competition” tool in the repo today.** The facilitator panel only offers:

- Flow status buttons (partial — do not reset team data)
- **Stop Timer** / **Reset Timer** (timer document only)

Reliable re-testing requires a **manual Firestore reset** (Console or script) or a **future Competition Reset feature** (designed in §6).

---

## 1. Why tests feel “stuck” after a previous run

| Symptom | Persisted where | Why flow buttons do not fix it |
|---------|-----------------|--------------------------------|
| Old Stage 1 score / question index | `teamStates/*/stageScores.stage1`, `progress.stage1QuestionIndex` | `stage1_running` does not zero scores |
| Duplicate answer rejected | `competitions/main/answers/stage1_*` | Transaction sees `confirmed: true` |
| Stage 2 roles locked / field progress | `teamStates/*/stage2Roles`, `progress.stage2*` | Role assignment writes persist |
| Stage 2 scores | `teamStates/*/stageScores.stage2` | Not cleared on `stage2_intro` |
| Stage 3 cells “used” | `gameFlow.stage3UsedQuestionIds` | Only grows on reveal; not cleared on `stage3_board` |
| Stage 3 opened cells | `gameFlow.stage3OpenedQuestionIds` | Persists across board returns |
| Active Stage 3 question | `gameFlow.stage3ActiveQuestion`, owner fields | Cleared only on some transitions |
| Timer still expired / wrong phase | `competitions/main/system/timer` | Must use Stop/Reset Timer or manual doc edit |
| Total ranking wrong | `teamStates/*/totalScore` | Sum of stage scores; never auto-reset |

Client UI state (React `useState`) is **secondary**. Stage 1 question index is read from Firestore (`useStage1TeamProgress`); refresh **resumes** stored progress, not a clean run.

---

## 2. How to fully reset the competition today

Use this for a **clean rehearsal** on the same Firebase project and test teams.

### 2.1 Prerequisites

- Firebase Console access to the project in `.env.local`
- Know test team UIDs (Authentication → Users, or `teams` collection doc IDs)
- **Stop** active facilitator timers from `/facilitator` → **Reset Timer** (optional but recommended before editing timer doc)
- All browsers: hard refresh after Firestore reset

### 2.2 What to keep (do not delete)

| Path | Reason |
|------|--------|
| `teams/{uid}` | Registration: name, email, players, logo |
| `users/{uid}` | Facilitator / super_admin / viewer accounts |
| Firebase Auth users | Login still works |

Deleting `teams` or `users` forces re-registration and new UIDs (orphans old `teamStates` if not cleaned).

### 2.3 What to clear or rewrite (competition runtime)

#### A. Delete all answer documents (required for duplicate guards)

**Collection:** `competitions` → `main` → `answers`

Delete **every document** in the subcollection. ID patterns include:

| Pattern | Stage |
|---------|--------|
| `stage1_{questionId}_{teamId}` | Stage 1 |
| `stage2_matching_{questionId}_{teamId}` | Stage 2 |
| `stage2_arrangeVerse_{questionId}_{teamId}` | Stage 2 |
| `stage2_completeVerse_{questionId}_{teamId}` | Stage 2 |
| `stage2_trueFalseCorrect_{questionId}_{teamId}` | Stage 2 |
| `stage3_{questionId}_{teamId}` | Stage 3 |

**Console:** Firestore → `competitions/main/answers` → select all → delete (or delete in batches if large).

Without this step, confirm endpoints return `duplicate: true` and scores may not change.

#### B. Reset each `teamStates` document

**Collection:** `competitions` → `main` → `teamStates` → `{teamId}`

For **each** test team, set fields to match `createInitialTeamState()` in `firebase/firestore.ts` (keep `teamId`, `teamName`, `governorate`):

| Field | Reset value |
|-------|-------------|
| `ready` | `false` |
| `readiness.*` | all `false` |
| `stageScores.stage1` … `stage4` | `0` |
| `totalScore` | `0` |
| `progress.stage1QuestionIndex` | `0` |
| `progress.stage2Field` | `""` |
| `progress.stage2FieldIndex` | `0` |
| `progress.stage2QuestionIndex` | `0` |
| `progress.stage3SelectedQuestionId` | `""` |
| `progress.stage3.currentField` | `""` |
| `progress.stage3.questionIndex` | `0` |
| `progress.stage4QuestionIndex` | `0` |
| `stage2Roles` | `{ matching: "", arrangeVerse: "", completeVerse: "", trueFalseCorrect: "" }` — remove `locked` / `lockedAt` or set `locked: false` |
| `stage4.streak` | `0` |
| `stage4.nextCorrectPoints` | `15` |
| `connection.online` | `true` (optional) |
| `updatedAt` | server timestamp (Console: use “Add field” timestamp or run from app later) |

**Faster alternative (dev only):** delete each `teamStates/{teamId}` doc and re-trigger registration flow — only if you can recreate team state (register again or call `createInitialTeamState` from a dev script). Deleting without recreating breaks `/team` until state is recreated.

#### C. Reset `gameFlow` document

**Document:** `competitions` → `main` → `system` → `gameFlow`

Minimum fields written by the app today:

```json
{
  "status": "waiting_players",
  "currentStage": "none",
  "currentQuestion": 0,
  "stage3ActiveQuestion": null,
  "stage3OpenedQuestionIds": [],
  "stage3UsedQuestionIds": [],
  "stage3OwnerTeamId": null,
  "stage3OwnerTeamName": null
}
```

Then in `/facilitator`, click **شاشة الانتظار** or advance from `waiting_players` as needed.

**Note:** Facilitator “شاشة الانتظار” only sets `status` + `currentStage` — it does **not** clear Stage 3 arrays. You must edit `gameFlow` manually or use the proposed reset tool (§6).

#### D. Reset `timer` document

**Document:** `competitions` → `main` → `system` → `timer`

Either:

- `/facilitator` → **Reset Timer**, or  
- Set fields to:

```json
{
  "active": false,
  "stage": "none",
  "purpose": "none",
  "durationSeconds": 0,
  "startedAtMs": 0,
  "endsAtMs": 0
}
```

Timer `stage` in types also supports `"stage3"` at runtime; reset avoids expired `endsAtMs` blocking Stage 1 answers.

### 2.4 Recommended test sequence after reset

1. Confirm `gameFlow.status` = `waiting_players`
2. Confirm all `teamStates` scores/progress zeroed
3. Confirm `answers` subcollection empty
4. Open `/facilitator` → start flow from intro / Stage 1
5. Open `/team` in incognito per team (see `docs/stage1-test-checklist.md`)
6. Use **http://localhost:3000** (single dev server)

### 2.5 What “partial reset” does today (not sufficient)

| Facilitator action | Resets |
|--------------------|--------|
| شاشة الانتظار | `gameFlow.status`, `currentStage` only |
| إنهاء المرحلة الأولى / الثانية / الثالثة | Status + stops timer (`active: false`); Stage 3 clears `stage3ActiveQuestion` on finish |
| Stop Timer | `timer.active = false` |
| Reset Timer | Full timer doc defaults |
| Return to board (Stage 3) | Clears active question; **keeps** `stage3UsedQuestionIds` / `stage3OpenedQuestionIds` |

None of these clear `teamStates` scores, Stage 1 index, Stage 2 roles, or `answers`.

---

## 3. Firestore map (competition `main`)

```
competitions/
  main/
    system/
      gameFlow          ← global status + Stage 3 board state
      timer             ← central countdown
    teamStates/
      {teamId}/         ← scores, progress, stage2 roles
    answers/
      {answerId}/       ← all confirmed answers (duplicate guard)
teams/
  {uid}/                ← registration (keep)
users/
  {uid}/                ← staff roles (keep)
```

### 3.1 `gameFlow` fields (runtime, beyond `types/index.ts`)

| Field | Purpose |
|-------|---------|
| `status` | Routes all shells (`GameFlowStatus`) |
| `currentStage` | `none`, `stage1`, `stage2`, `stage3`, `final` |
| `currentQuestion` | Lightly used (number) |
| `stage3ActiveQuestion` | Object metadata for open question |
| `stage3OpenedQuestionIds` | string[] — cells opened at least once |
| `stage3UsedQuestionIds` | string[] — cells consumed after reveal |
| `stage3OwnerTeamId` | Turn owner team uid |
| `stage3OwnerTeamName` | Display name |

### 3.2 `timer` fields

See `docs/project-master-context.md` §2.1. Stage 3 open question sets `stage: "stage3"`, `purpose: "answering"`, 20s.

### 3.3 `teamStates` — progress & scoring

See `firebase/firestore.ts` → `createInitialTeamState()` and `docs/project-master-context.md` §2.1.

### 3.4 `answers` — common fields

All stages write to the same collection with `confirmed`, `isCorrect`, `pointsDelta`, `questionId`, `teamId`, etc. Stage 3 adds `visibleToAudience` (set `true` on reveal batch).

---

## 4. Does a reset tool already exist?

| Location | Reset capability? |
|----------|-------------------|
| `/facilitator` → Reset Timer | **Timer only** (`features/facilitator/components/facilitator-shell.tsx` → `resetTimer()`) |
| `/facilitator` flow buttons | **Routing only**; no data wipe |
| `/admin` | Links to facilitator + dev user creator; **no reset** |
| `/dev/create-admin-user` | Creates admin user doc; **no reset** |
| Old ZIP (`admin-game-flow.js`) | `resetGameFlowV960()` — **not ported** to Next app |
| Repo scripts | **None** for Firestore cleanup |
| `firestore.rules` | **Not in repo** — Console/script access depends on your Firebase project rules |

**Conclusion:** No end-to-end **Competition Reset** exists in the current Next.js codebase.

---

## 5. Testability gaps (why manual reset is painful)

1. **Many write surfaces** — Stages 1–3 each append answers and mutate `teamStates`.
2. **Duplicate prevention** — Requires deleting answer docs, not just lowering scores.
3. **Stage 3 board state on `gameFlow`** — Easy to leave `usedQuestionIds` non-empty.
4. **Stage 2 roles `locked: true`** — Blocks reassignment UX until cleared.
5. **No `firestore.rules` in repo** — Cannot document client-only reset; likely needs facilitator/admin SDK or open dev rules.
6. **Single shared `main` competition** — All devs share one Firestore namespace.
7. **Multiple dev servers / ports** — Unrelated to Firestore but causes chunk/CSS confusion (see prior runtime audit).

---

## 6. Proposed feature: Competition Reset

### 6.1 Goals

One facilitator/super-admin action: **“إعادة ضبط المسابقة (اختبار)”** → returns competition `main` to a known baseline **without** deleting team registration or staff accounts.

### 6.2 Placement

| Option | Pros | Cons |
|--------|------|------|
| `/facilitator` → dangerous action zone | Same operator as flow | Risk in live event |
| `/admin` only | Safer | Extra navigation |
| `/dev/reset-competition` | Dev-only URL | Must guard production |

**Recommendation:** `/admin` + `/facilitator` (super_admin + facilitator) with `NODE_ENV === 'development'` gate OR explicit `allowCompetitionReset` flag in `gameFlow`.

### 6.3 Reset scopes (checkboxes)

| Scope | Actions |
|-------|---------|
| **Full competition** (default) | Answers + all teamStates + gameFlow + timer |
| **Stage 1 only** | Delete `stage1_*` answers; zero `stageScores.stage1`, `progress.stage1QuestionIndex`; recalc `totalScore` |
| **Stage 2 only** | Delete `stage2_*` answers; zero stage2 scores/progress/roles |
| **Stage 3 only** | Delete `stage3_*` answers; clear Stage 3 gameFlow fields; zero `stageScores.stage3` + `progress.stage3*` |
| **Flow only** | gameFlow + timer (no scores) — *insufficient alone*; label clearly |

### 6.4 Implementation sketch (future code)

**Module:** `features/admin/reset-competition.ts` (or `features/gameflow/reset-competition.ts`)

**Function:** `resetCompetitionMain(options: ResetScope): Promise<ResetReport>`

1. **Guard:** Caller role `facilitator` | `super_admin`; optional dev flag.
2. **Confirm UI:** Type competition id `main` or Arabic confirm phrase.
3. **Delete answers:** Query `competitions/main/answers` in batches (Firestore batch limit 500 ops); or recursive delete via Admin SDK.
4. **Reset teamStates:** `getDocs(teamStatesCollectionRef('main'))` → each doc `update` to initial shape (reuse `createInitialTeamState` field template + preserve `teamName`, `governorate`, `teamId`).
5. **Reset gameFlow:** `setDoc(gameFlowRef, { ...INITIAL_GAME_FLOW }, { merge: false })` or `updateDoc` all known keys.
6. **Reset timer:** Same payload as `resetTimer()` in facilitator-shell.
7. **Report:** Counts deleted answers, teams reset, timestamp, operator uid.
8. **Post-reset:** Set `gameFlow.status` to `waiting_players`; show toast with link to checklist.

**Do not use client-side `deleteCollection` without security rules** — prefer Cloud Function `resetCompetition` callable with Admin SDK for production safety.

### 6.5 Initial `gameFlow` payload (canonical)

```typescript
const INITIAL_GAME_FLOW = {
  status: "waiting_players",
  currentStage: "none",
  currentQuestion: 0,
  stage3ActiveQuestion: null,
  stage3OpenedQuestionIds: [],
  stage3UsedQuestionIds: [],
  stage3OwnerTeamId: null,
  stage3OwnerTeamName: null,
};
```

### 6.6 Safety rules

- Block reset if `gameFlow.status` is `final_results` or `podium` unless `force: true`.
- Log to `competitions/main/system/resetLog` (append-only array or subcollection) for audit.
- Never delete `teams/`, `users/`, or Auth accounts in v1.

### 6.7 Acceptance criteria

- After full reset, two test teams can run Stage 1 from question 0 with 0 points.
- Re-answering same mock question does not hit duplicate guard.
- Stage 3 board shows all cells available (`usedQuestionIds` empty).
- Facilitator timer can start fresh without “expired” block on Stage 1.

---

## 7. Quick reference checklist (printable)

```
[ ] Delete all docs under competitions/main/answers
[ ] For each competitions/main/teamStates/{id}:
    [ ] stageScores.* = 0, totalScore = 0
    [ ] progress.* = initial
    [ ] stage2Roles cleared / unlocked
[ ] competitions/main/system/gameFlow → waiting_players + Stage 3 arrays empty
[ ] competitions/main/system/timer → inactive (or Reset Timer in UI)
[ ] Facilitator: شاشة الانتظار
[ ] Hard refresh team browsers
[ ] Single dev server on http://localhost:3000
```

---

## 8. Related docs

| Doc | Use |
|-----|-----|
| `docs/stage1-test-checklist.md` | Stage 1 E2E after reset |
| `docs/stage1-freeze-v1.md` | Stage 1 Firestore paths |
| `docs/project-master-context.md` | Full schema reference |
| `docs/stage3-reveal-ranking.md` | Stage 3 `usedQuestionIds` lifecycle |
| `firebase/firestore.ts` | `createInitialTeamState()` template |

---

*Audit only — no application code was modified.*
