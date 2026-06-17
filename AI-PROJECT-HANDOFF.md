# سفراء المسيح — دليل المشروع الكامل لأي AI

> **الغرض:** مصدر handoff شامل لفهم المشروع والمتابعة دون سياق سابق.  
> **آخر تحديث:** يونيو 2026 — مُحقَّق مقابل الكود في `codex-master-prompt-v1-sufaraa-al`  
> **اللغة:** واجهة عربية RTL — الكود والمسارات بالإنجليزية.  
> **تنبيه صادق:** لا يوجد توثيق «100% مطلق» بدون قراءة الكود. هذا الملف يغطي **~95%** من ما يحتاجه AI. عند التعارض: **الكود wins**.

---

## فهرس

1. [نظرة عامة](#1-نظرة-عامة)
2. [التقنيات والتشغيل](#2-التقنيات-والتشغيل)
3. [هيكل المجلدات](#3-هيكل-المجلدات)
4. [المسارات والأدوار](#4-المسارات-والأدوار)
5. [Firestore — مخطط البيانات الكامل](#5-firestore--مخطط-البيانات-الكامل)
6. [Game Flow والمؤقت](#6-game-flow-والمؤقت)
7. [نظام السجل والتعديلات](#7-نظام-السجل-والتعديلات)
8. [لوحة الميسر](#8-لوحة-الميسر)
9. [شاشة الفريق](#9-شاشة-الفريق)
10. [شاشة الجمهور](#10-شاشة-الجمهور)
11. [قواعد النقاط](#11-قواعد-النقاط)
12. [المراحل الأربع — تفصيل](#12-المراحل-الأربع--تفصيل)
13. [خطة الميسر لكل status](#13-خطة-الميسر-لكل-status)
14. [API التحكم الإداري](#14-api-التحكم-الإداري)
15. [الأتمتة Headless](#15-الأتمتة-headless)
16. [CSS والتصميم](#16-css-والتصميم)
17. [قواعد عمل AI](#17-قواعد-عمل-ai)
18. [Edge cases و gotchas](#18-edge-cases-و-gotchas)
19. [ملفات محذوفة/مرجعية](#19-ملفات-محذوفةمرجعية)
20. [مهام معلقة](#20-مهام-معلقة)
21. [سياق المحادثات الأخيرة](#21-سياق-المحادثات-الأخيرة)
22. [كيف تبدأ AI جديدة](#22-كيف-تبدأ-ai-جديدة)

---

## 1. نظرة عامة

**منصة مسابقة تفاعلية** للعائلات المسيحية — 4 مراحل + ختام (نتائج + منصة).

| الدور | Route | AuthGate |
|--------|-------|----------|
| فريق | `/team` | `team` |
| ميسر | `/facilitator` | `facilitator`, `super_admin` |
| مشرف عام | `/admin` | `super_admin` |
| جمهور | `/audience` | لا (عام) |

**مصدر الحقيقة:** Firebase Firestore + Auth + Storage. كل الشاشات تتزامن عبر `onSnapshot`.

**Competition ID ثابت:** `main` → `MAIN_COMPETITION_ID` في `firebase/firestore.ts`

---

## 2. التقنيات والتشغيل

| Layer | Stack |
|-------|--------|
| Framework | Next.js 15 App Router |
| UI | React 19, Tailwind, Radix Tabs |
| Backend | Firebase 12 (Auth, Firestore, Storage) |
| Forms | react-hook-form + zod |
| Export PNG | html2canvas |
| Excel | xlsx (بنك أسئلة M1) |

```bash
cp .env.example .env.local   # املأ NEXT_PUBLIC_FIREBASE_*
npm install
npm run dev
npm run typecheck
npm run lint
```

**Windows:** السكربتات تضبط `NEXT_TEST_WASM=1` + `@next/swc-wasm-nodejs`.  
**لا تشغّل** `npm run build` مع `npm run dev` على Windows في نفس الوقت.

**Env vars:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`

---

## 3. هيكل المجلدات

```
app/                 → Routes (page.tsx)
components/          → layout, competition, ui
features/
  auth/              → AuthGate, login forms
  facilitator/       → لوحة الميسر (الأهم)
  gameflow/          → gameFlow, timer, reset, labels
  team/              → team-shell, use-team-game-flow
  audience/          → audience-shell
  stage1/ … stage4/  → منطق كل مرحلة
firebase/            → client, auth, firestore refs, get-user-role
hooks/               → use-auth-role
lib/                 → utils, debug
types/index.ts       → GameFlowStatus, roles, TeamStateDocument
docs/                → sprint audits (مرجع تاريخي)
_knowledge/          → توثيق قديم — ليس مصدر الحقيقة
AI-PROJECT-HANDOFF.md → هذا الملف
```

**لا يوجد:** `firestore.rules` في الrepo، `middleware.ts`، `README.md` في الجذر.

---

## 4. المسارات والأدوار

### Routes

| Route | File | ملاحظات |
|-------|------|---------|
| `/` | `app/page.tsx` | → `/login` |
| `/login` | `app/login/page.tsx` | بوابة |
| `/team-login` | | |
| `/register` | | ينشئ teams + teamState |
| `/facilitator-login` | | ميسر + super_admin |
| `/admin-login` | | super_admin |
| `/team` | | |
| `/facilitator` | | |
| `/admin` | | reset + روابط |
| `/audience` | | عام |
| `/dev/create-admin-user` | | dev only |
| `/dev/gradient-background` | | demo غير موصول |

### تحديد الدور — `firebase/get-user-role.ts`

1. `teams/{uid}` exists → `team`
2. else `users/{uid}.role` → `viewer` | `facilitator` | `super_admin`
3. else → `null`

### AuthGate — `features/auth/components/auth-gate.tsx`

- `useAuthRole()` — timeout 8s role / 12s auth
- `super_admin` يدخل `/facilitator` أيضاً

### تسجيل فريق — `firebase/auth.ts`

Auth user → `teams/{uid}` → `competitions/main/teamStates/{uid}` → logo اختياري Storage

### viewer role

معرّف في types، route `/audience`، **لا login UI مخصص** في production.

---

## 5. Firestore — مخطط البيانات الكامل

### `teams/{uid}`

```typescript
{
  teamName: string,
  governorate: string,
  email: string,
  role: "team",
  logoUrl?: string,
  players: { name: string, type: "main"|"substitute" }[],
  active: true,
  createdAt: Timestamp
}
```

### `users/{uid}`

```typescript
{ fullName, email, role: "facilitator"|"super_admin"|"viewer" }
```

### `competitions/main/system/gameFlow`

**Doc ref:** `gameFlowRef` — **الحقل الأهم:** `status: GameFlowStatus`

| Field | Type | Purpose |
|-------|------|---------|
| `status` | GameFlowStatus | الشاشة الحالية للجميع |
| `currentStage` | string | `"none"` \| `"stage1"` … `"final"` |
| `currentQuestion` | number | legacy/index |
| `activeSessionId` | string \| null | رابط سجل المسابقة النشط |
| `durations` | object | مدد المؤقتات — انظر §6 |
| `updatedAt` | Timestamp | |
| **Stage 3** | | |
| `stage3ActiveQuestion` | object \| null | metadata السؤال الحالي |
| `stage3OpenedQuestionIds` | string[] | أسئلة فُتحت |
| `stage3UsedQuestionIds` | string[] | أسئلة اُستخدمت |
| `stage3OwnerTeamId` | string \| null | مالك السؤال |
| `stage3OwnerTeamName` | string \| null | |
| `stage3OwnerTurnIndex` | number | |
| `stage3TurnOrder` | array | `{ teamId, teamName, totalScoreAtStart }[]` |
| `stage3SelectionStartedAt` | number | |
| `stage3LastAutoAdvanceKey` | string | idempotency |
| `stage3RoundId` | string | |
| `stage3LastSelectionTimeoutKey` | string | |
| `stage3SelectionTimeoutNotice` | object \| null | |
| **Stage 4** | | |
| `stage4QuestionIndex` | number | 0-based |
| `stage4QuestionCount` | number | default 15 |
| `stage4ActiveQuestion` | object \| null | |
| `stage4FinishedQuestionIds` | string[] | |
| `stage4RevealStartedAt` | number | |

**Initial reset payload:** `features/gameflow/competition-reset.ts` → `buildInitialGameFlowPayload()`

### `competitions/main/system/timer`

| Field | Purpose |
|-------|---------|
| `active` | boolean |
| `stage` | `"stage1"`\|`"stage2"`\|`"stage3"`\|`"stage4"`\|`"none"` |
| `purpose` | `"answering"`\|`"reading"`\|`"selection"`\|`"reveal"`\|`"none"` |
| `durationSeconds` | |
| `startedAtMs`, `endsAtMs` | |
| `paused`, `pausedRemainingMs` | pause/resume |
| `updatedAt` | |

### `competitions/main/teamStates/{uid}`

| Field | Purpose |
|-------|---------|
| `teamId`, `teamName`, `governorate` | |
| `ready` | boolean — جاهزية عامة |
| `readiness.competitionIntro` | boolean |
| `readiness.stage1Intro` | boolean — **يُكتب في runtime** |
| `readiness.stage1` … `stage4` | boolean — gates مراحل |
| `connection.online`, `lastSeenAt` | |
| `stageScores.stage1`…`stage4` | number |
| `totalScore` | number |
| `progress.stage1QuestionIndex` | |
| `progress.stage2Field`, `stage2FieldIndex`, `stage2QuestionIndex` | |
| `progress.stage3SelectedQuestionId` | |
| `progress.stage3.currentField`, `questionIndex` | |
| `progress.stage4QuestionIndex` | |
| `stage2Roles.matching`…`trueFalseCorrect` | player uid per field |
| `stage2Roles.locked`, `lockedAt` | |
| `stage4.streak`, `nextCorrectPoints` | streak M4 |
| `stageLocks.stage1`…`stage4` | boolean — قفل من الميسر |
| `facilitatorOverride` | object \| null — انظر §14 |
| `updatedAt` | |

**⚠️ تناقض (مُصلَح يونيو 2026):** `buildInitialTeamStateDocument()` يكتب الآن `readiness.stage1Intro` و `readiness.stage1`. الفرق الأول لجاهزية مقدمة المرحلة 1؛ الثاني لبوابة المرحلة.

### `competitions/main/answers/{id}`

ID patterns: `stage1_{questionId}_{teamId}`, stage2/3/4 patterns في confirm modules.

```typescript
{
  teamId, teamName, stage, field?,
  questionText, questionId?, answer,
  isCorrect: boolean, confirmed: true,
  pointsDelta: number,
  passed?: boolean,           // stage4
  createdAt / confirmedAt: Timestamp,
  visibleToAudience?: boolean // stage3 reveal
}
```

### `competitions/main/questionBanks/stage1`

بنك أسئلة M1 — يُحرَّر من تبويب بنك الأسئلة + Excel import.

### `competitions/main/history/{sessionId}`

```typescript
{
  title: string,              // "مسابقة سفراء المسيح {نسخة} في محافظة {محافظة}"
  version: string,
  hostGovernorate: string,
  status: "active" | "completed",
  teams: ArchiveTeam[],       // نتائج نهائية
  editLogEntries: EditLogEntry[],  // arrayUnion — ليس subcollection
  startedAt, archivedAt: Timestamp,
  startedByUid, startedByName,
  resultsSavedAt, resultsSavedMode: "manual"|"auto"|null,
  lastModifiedAtMs: number
}
```

### `competitions/main/auditLog/{id}`

Best-effort parallel log — `facilitator-team-admin.ts` → `appendAuditLog()`

### Storage

`teams/{uid}/logo.{ext}`

---

## 6. Game Flow والمؤقت

### القراءة

`features/gameflow/use-game-flow.ts` — `onSnapshot(gameFlowRef)`

### الكتابة

`features/facilitator/facilitator-flow-actions.ts`:
- `setGameFlowStatus(nextStatus, nextStage)` — side effects:
  - `stage1_running` / `stage2_reading` → starts timer
  - `stage2_player_turns` → stops timer
  - `stage3_board` → clears `stage3ActiveQuestion`
  - `competition_intro` → requires `activeSessionId` or throws
  - `podium` → auto `saveActiveSessionResults(teams, "auto")`
- `finishStage(1|2|3|4)` → `stageN_finished` + stop timer
- `pauseTimer`, `resumeTimer`, `resetTimer`

### مدد المؤقت الافتراضية — `facilitator-timer-settings.ts`

| Key | Seconds | Default label |
|-----|---------|---------------|
| `stage1` | 420 | 7 min |
| `stage2Reading` | 180 | 3 min |
| `stage2Turn` | 150 | 2.5 min/field |
| `stage3Selection` | 15 | |
| `stage3Answer` | 20 | |
| `stage3Reveal` | 10 | |
| `stage4Answer` | 60 | |

تُخزَّن في `gameFlow.durations` — تبويب الإعدادات يكتبها.

### تسلسل status الكامل

```
waiting_players → competition_intro → stage1_intro → stage1_running → stage1_finished
→ stage2_intro → stage2_role_assignment → stage2_reading → stage2_player_turns → stage2_finished
→ stage3_intro → stage3_board → stage3_question_open → stage3_answer_closed → stage3_reveal
→ stage3_results_done → stage3_finished
→ stage4_intro → stage4_waiting_question → stage4_question_open → stage4_answers_closed
→ stage4_reveal → stage4_finished
→ final_results → podium
```

### Labels عربية

`features/gameflow/gameflow-copy.ts` → `gameFlowLabels`, `audienceGameFlowLabels`

---

## 7. نظام السجل والتعديلات

**الملف:** `features/facilitator/competition-session.ts`

### بدء مسابقة

1. زر «بدء مقدمة المسابقة» → `FacilitatorSessionStartDialog`
2. `createCompetitionSession({ version, hostGovernorate })`
3. `gameFlow.activeSessionId = sessionId`
4. `editLogEntries` += `session_started`

### حفظ النتائج

| Mode | Trigger |
|------|---------|
| auto | `setGameFlowStatus("podium")` |
| manual | تبويب النتائج → `saveActiveSessionResults` |

### سجل التعديلات

- **مخزَّن في:** `history/{id}.editLogEntries[]` via `arrayUnion`
- **للقراءة فقط** في UI
- **كل entry:** `{ id, action, reason, facilitatorName, facilitatorUid, createdAtMs, createdAt, beforeValue?, afterValue?, details?, teamId?, teamName? }`
- **Hook:** `useSessionEditLog(sessionId)` — listens to history doc

### بطاقة التأكيد

`FacilitatorControlsConfirmCard` — التحكم + السجل. سبب ≥3 chars.

### actions في editLog (من session + admin)

| action | Source |
|--------|--------|
| `session_started` | createCompetitionSession |
| `results_saved` | saveSessionResults |
| `session_metadata_updated` | updateSessionMetadata |
| `session_results_updated` | updateSessionTeams |
| `score_adjust` | adjustTeamScore |
| `progress_reset` | resetTeamStageProgress |
| `reset_all_scores` | resetAllTeamScores |
| `migrate_all_teams` | migrateAllTeamsToStage |
| `update_team_profile` | updateTeamProfile / updateTeamFullProfile |
| `remove_team` | removeTeamFromCompetition |
| `set_stage_locks` | toggleTeamStageLock |
| `set_stage_locks_all` | setTeamStageLocks |
| `team_override` | setTeamFacilitatorOverride |
| `clear_team_override` | clearTeamFacilitatorOverride |
| `delete_team_answers` | deleteTeamAnswers |
| `reset_team_competition_data` | resetTeamCompetitionData |
| `delete_team_completely` | deleteTeamCompletely |

**⚠️** `appendActiveSessionEditLog` **لا يفعل شيئاً** إذا لا `activeSessionId` — تعديلات التحكم لا تُسجَّل في السجل بدون مسابقة نشطة.

---

## 8. لوحة الميسر

**Shell:** `facilitator-shell.tsx` — 8 tabs

| Tab | value | Main file |
|-----|-------|-----------|
| سير المسابقة | flow | `facilitator-flow-panel.tsx` |
| التحكم | controls | `facilitator-controls-tab.tsx` |
| النتائج | results | `facilitator-results-tab.tsx` |
| شاشة الجمهور | audience | `facilitator-audience-tab.tsx` |
| السجل | history | `facilitator-history-tab.tsx` |
| بنك الأسئلة | questions | `facilitator-question-bank-tab.tsx` |
| عن المسابقة | about | `facilitator-about-tab.tsx` |
| الإعدادات | settings | `facilitator-settings-tab.tsx` |

### Flow tab structure

```
FacilitatorStageRail
FacilitatorCommandDeck (hero + manual jump + timer ring)
FacilitatorPhaseCanvas (conditional)
FacilitatorStagePanel (M3/M4 workspace)
FacilitatorScoreboard
FacilitatorSessionStartDialog (on first advance)
```

**Manual jump:** `facilitator-manual-jump.tsx` — كل statuses

**Stage workspace:** `facilitator-stage-panel.tsx`:
- M3 (not intro/finished): `Stage3FacilitatorUnifiedPanel`
- M3 finished: `Stage3FinishedScreen variant=facilitator`
- M4 (not finished): `Stage4FacilitatorPanel`
- M4 finished: `Stage4FinishedScreen variant=facilitator`

**Scoreboard modes:** pre-start teams list / live results (`use-live-results.ts`)

### Controls tab

- Team selector → profile edit, override, locks, score adjust, delete answers, reset, delete team
- Global locks when no team selected
- Answers inline table via `useAnswersLog` (same data as deleted log tab)
- Confirm card before every mutation

---

## 9. شاشة الفريق

**Shell:** `team-shell.tsx` + `useTeamGameFlow()`

### Override + Lock logic

```typescript
effectiveStatus = override?.active ? override.status : global.status
lockedStageKey = isTeamStageLocked(stageLocks, effectiveStatus) ? stageKey : null
```

If locked → `TeamStageLockedScreen` (before stage content)

### Status → Component (Team)

| status | Component |
|--------|-----------|
| `waiting_players` | TeamWaitingScreen |
| `competition_intro` | TeamCompetitionIntroScreen |
| `stage1_intro` | TeamStage1IntroScreen |
| `stage1_running` | Stage1RunningScreen (lazy) |
| `stage1_finished` | Stage1TeamFinishedScreen |
| `stage2_intro` | Stage2IntroScreen |
| `stage2_role_assignment` | Stage2RoleAssignmentScreen |
| `stage2_reading` | Stage2ReadingScreen |
| `stage2_player_turns` | Stage2PlayerTurnsScreen (lazy) |
| `stage2_finished` | Stage2TeamFinishedScreen |
| `stage3_intro` | Stage3IntroScreen |
| `stage3_board` | Stage3TeamBoardScreen + Stage3RankingTable |
| `stage3_question_open` | Stage3TeamQuestionOpenScreen |
| `stage3_answer_closed` | Stage3TeamWaitingScreen |
| `stage3_reveal` | Stage3TeamRevealScreen |
| `stage3_results_done` | Stage3TeamRevealScreen + ranking |
| `stage3_finished` | Stage3FinishedScreen variant=team |
| `stage4_intro` | Stage4IntroScreen |
| `stage4_waiting_question` | Stage4WaitingScreen |
| `stage4_question_open` | Stage4TeamQuestionScreen |
| `stage4_answers_closed` | inline wait card |
| `stage4_reveal` | Stage4TeamRevealScreen |
| `stage4_finished` | Stage4FinishedScreen variant=team |
| `final_results` | TeamFinalResultsScreen |
| `podium` | TeamPodiumScreen |
| unhandled M3 | Stage3TeamPlaceholderScreen |
| fallback | GameFlowPlaceholder |

### Readiness (team confirms)

| Gate | Firestore field | Confirm file |
|------|-----------------|--------------|
| competition intro | `readiness.competitionIntro` | `confirm-competition-intro-ready.ts` |
| stage1 intro | `readiness.stage1Intro` | `confirm-stage1-intro-ready.ts` |

Facilitator hero blocked until all teams ready (`readinessKey` in flow plan).

---

## 10. شاشة الجمهور

**Shell:** `audience-shell.tsx` — uses raw `useGameFlow()` (no override/lock)

### Status → Component (Audience)

| status | Component |
|--------|-----------|
| `competition_intro` | AudienceCompetitionIntroScreen |
| `stage1_intro` | Stage1IntroScreen |
| `stage1_running` | AudienceStage1Running |
| `stage1_finished` | AudienceStage1Finished |
| `stage2_reading` | AudienceStage2Reading |
| `stage2_finished` | AudienceStage2Finished |
| `stage3_board` | Stage3AudienceBoardScreen + ranking |
| `stage3_question_open` | Stage3QuestionOpenScreen |
| `stage3_answer_closed` | Stage3AudienceWaitingScreen |
| `stage3_reveal` | Stage3AudienceRevealScreen + ranking |
| `stage3_results_done` | Stage3AudienceWaitingScreen results_done |
| `stage3_finished` | Stage3FinishedScreen variant=audience |
| `stage4_intro` | simple card |
| `stage4_waiting_question` | Stage4WaitingScreen |
| `stage4_question_open` | Stage4AudienceQuestionScreen |
| `stage4_answers_closed` | "بانتظار الإعلان" card |
| `stage4_reveal` | Stage4AudienceRevealScreen |
| `stage4_finished` | Stage4FinishedScreen variant=audience |
| unhandled M3 | Stage3AudiencePlaceholder |
| fallback | GameFlowPlaceholder |

**ملاحظة:** الجمهور coverage أقل من الفريق — كثير statuses تعرض placeholder.

---

## 11. قواعد النقاط

### المرحلة 1 — `confirm-stage1-answer.ts`

- **+5** إذا صحيح، **0** إذا خطأ
- one answer per question per team (duplicate returns existing)
- requires `status === stage1_running` + timer not expired

### المرحلة 2 — all confirm-stage2-*.ts

- **+15** إذا صحيح، **0** إذا خطأ
- 4 field types: matching, arrangeVerse, completeVerse, trueFalseCorrect
- each player assigned via `stage2Roles`

### المرحلة 3 — `stage3-scoring.ts`

**Owner team** (cannot pass):

| Difficulty | Correct | Wrong | No answer |
|------------|---------|-------|-----------|
| easy | +15 | -5 | -5 |
| medium | +30 | -10 | -10 |
| hard | +45 | -15 | -15 |

**Other teams:**

| Difficulty | Correct | Wrong | Pass/No answer |
|------------|---------|-------|----------------|
| easy | +5 | -5 | 0 |
| medium | +10 | -10 | 0 |
| hard | +15 | -15 | 0 |

Board preview: `STAGE3_SCORE_PREVIEW_BY_DIFFICULTY` in `stage3-board-data.ts`  
Board: 5 fields × 6 questions (2 easy, 2 medium, 2 hard each)

### المرحلة 4 — `stage4-scoring.ts`

- Base: **15** for first correct in streak
- Formula: `15 + (streakIncludingThis - 1) * 2`
- Wrong or pass → streak resets to 0
- `teamState.stage4.streak`, `nextCorrectPoints` updated on confirm
- Pass allowed (no answer text)

### المجموع

`totalScore` = sum of stage scores (stored + updated on each confirm/adjust)

---

## 12. المراحل الأربع — تفصيل

### Stage 1 — `features/stage1/`

- Types: `stage1-types.ts` — missingWord, fillBlank, multipleChoice, arrange
- Questions: Firestore bank + `stage1-mock-questions.ts` fallback
- Max 50 questions
- Key: `confirm-stage1-answer.ts`, `use-stage1-ranking.ts`

### Stage 2 — `features/stage2/`

- Flow: intro → role assignment → reading (auto timer) → player turns → finished
- Reading timer auto-advances to turns (automation)
- 4 confirm modules per question type
- Key screens in `team-shell` mapping above

### Stage 3 — `features/stage3/`

- Jeopardy board, turn order, owner selection timeout
- Key actions: `open-stage3-question.ts`, `confirm-stage3-answer.ts`, `start-stage3-reveal.ts`, `advance-stage3-turn.ts`
- Facilitator: `stage3-facilitator-unified-panel.tsx`
- Automation: selection timeout, auto-close answers, auto-return to board

### Stage 4 — `features/stage4/`

- Collective Q&A, configurable question count (settings)
- Flow: intro → waiting → open question (+ timer) → close answers → reveal → next/finish
- Key: `open-stage4-question.ts`, `confirm-stage4-answer.ts`, `start-stage4-reveal.ts`, `advance-stage4-question.ts`
- Facilitator: `stage4-facilitator-panel.tsx`
- Automation: `auto-close-stage4-answers.ts` on timer expiry
- `finishStage(4)` available from facilitator hero during active M4

---

## 13. خطة الميسر لكل status

**File:** `facilitator-flow-plan.ts` → `getFacilitatorPhasePlan(status)`

| status | Hero action | readinessKey | managedByPanel |
|--------|-------------|--------------|----------------|
| waiting_players | → competition_intro | — | no |
| competition_intro | → stage1_intro | competitionIntro | no |
| stage1_intro | → stage1_running | stage1Intro | no |
| stage1_running | finish → stage1_finished | — | no |
| stage1_finished | → stage2_intro | — | no |
| stage2_intro | → stage2_role_assignment | — | no |
| stage2_role_assignment | → stage2_reading | — | no |
| stage2_reading | → stage2_player_turns | — | no |
| stage2_player_turns | finish → stage2_finished | — | no |
| stage2_finished | → stage3_intro | — | no |
| stage3_intro | → stage3_board | — | no |
| stage3_board … stage3_results_done | finish stage3 | — | **yes** |
| stage3_finished | → stage4_intro | — | no |
| stage4_intro | — (panel only) | — | **yes** |
| stage4_waiting … stage4_reveal | finish stage4 | — | **yes** |
| stage4_finished | → final_results | — | no |
| final_results | → podium | — | no |
| podium | — | — | no |

---

## 14. API التحكم الإداري

**File:** `features/facilitator/facilitator-team-admin.ts`

| Function | Purpose |
|----------|---------|
| `adjustTeamScore` | delta ± on stage score + total |
| `resetTeamStageProgress` | reset progress indices for one stage |
| `resetAllTeamScores` | zero all teams |
| `migrateAllTeamsToStage` | move all to stage intro + reset progress |
| `updateTeamProfile` | name + governorate |
| `updateTeamFullProfile` | + players + email |
| `removeTeamFromCompetition` | delete teamState only |
| `deleteTeamCompletely` | answers + teamState + teams doc |
| `setTeamStageLocks` | all locks for one team |
| `toggleTeamStageLock` | one stage lock |
| `setTeamFacilitatorOverride` | exceptional screen jump |
| `clearTeamFacilitatorOverride` | |
| `deleteTeamAnswers` | |
| `resetTeamCompetitionData` | reset scores + progress |

**Every call:** `appendAuditLog` + `appendActiveSessionEditLog` (if active session)

### facilitatorOverride shape

```typescript
{
  active: true,
  status: GameFlowStatus,
  currentStage: string,
  stage1QuestionIndex?, stage2QuestionIndex?, stage4QuestionIndex?,
  stage3QuestionId?, stage3ActiveQuestion?, stage4ActiveQuestion?
}
```

**Override options:** `facilitator-controls-copy.ts` → `OVERRIDE_STATUS_OPTIONS` with `questionIndexScope` for stage1/2/4

---

## 15. الأتمتة Headless

Mounted in `facilitator-shell.tsx` — **always running**:

| Component | Triggers |
|-----------|----------|
| `FacilitatorStage12Automation` | M1 timer expired → finishStage(1); M2 reading expired → stage2_player_turns |
| `FacilitatorStage3Automation` | selection timeout, auto-close/reveal, auto-return board |
| `FacilitatorStage4Automation` | M4 answer timer expired → close answers |

All use fingerprint refs to avoid duplicate writes from multiple facilitator tabs.

---

## 16. CSS والتصميم

- **File:** `app/globals.css` (~4000 lines)
- Prefixes: `facilitator-*`, `competition-*`, `flow-*`, `glass-card-*`
- RTL: `dir="rtl"` on facilitator tabs
- Colors: `#143A5A`, `#2388C4`, `#4F8A10`, stage accents in `FLOW_COCKPIT_ACCENTS`
- Confirm modal: `facilitator-controls-confirm*` classes
- Podium: `competition-podium*` in `components/competition/competition-podium.tsx`

---

## 17. قواعد عمل AI

1. State changes → Firestore (`gameFlow` / `teamState`), not local-only
2. Sensitive edits → reason + editLog
3. Minimal diff — match existing patterns
4. No git commit unless user asks
5. No build + dev simultaneously on Windows
6. Update this file after architectural changes
7. `docs/` and `_knowledge/` are historical — verify against code
8. Password change for teams needs Firebase Admin SDK (email saves only)

---

## 18. Edge cases و gotchas

| Issue | Detail |
|-------|--------|
| No active session | Control edits won't appear in session editLog |
| Manual jump to competition_intro | Blocked without activeSessionId |
| Readiness field names | stage1Intro vs stage1 inconsistency in initial doc |
| super_admin | Can use /facilitator AND /admin |
| Same browser multi-role | Firebase Auth shared — use separate browsers/incognito |
| editLogEntries size | Firestore 1MB doc limit — many edits with large before/after arrays |
| Old history docs | May lack version/hostGovernorate/editLogEntries |
| Team podium screen | Uses `useStage1Ranking` not final results — same component class |
| appendSessionEditLog throws | History tab confirm shows error; admin append swallows |
| Firestore rules | Not in repo — verify in Firebase Console |
| stage4 finish | `finishStage(4)` from hero during active play states |

---

## 19. ملفات محذوفة/مرجعية

**Deleted (orphan cleanup Jun 2026):**
- `facilitator-log-tab.tsx`
- `competition-history.ts`
- `facilitator-controls-archive.ts`
- `use-registered-teams.ts`
- `stage2-finished-screen.tsx`
- `dev-debug-root.tsx`

**Reference only (don't treat as truth):**
- `docs/` — 26 sprint/audit markdown files
- `_knowledge/` — PRD, architecture docs
- `_ref-old-zip/` — old ZIP comparisons

---

## 20. مهام معلقة

- [x] Firestore security rules in repo + deploy docs (`firestore.rules`, `FIREBASE-DEPLOY.md`)
- [x] Fix readiness field inconsistency (`stage1Intro` in initial teamState)
- [x] editLogEntries cap (`MAX_EDIT_LOG_ENTRIES = 150`)
- [ ] viewer role login path or removal
- [ ] Team password change via Admin SDK
- [ ] Excel export for final results
- [ ] Fix readiness field inconsistency (stage1 vs stage1Intro)
- [ ] Audience coverage for more statuses (currently many placeholders)
- [ ] README.md pointing to this file

---

## 21. سياق المحادثات الأخيرة

1. **Controls tab** — full rebuild: team selector, locks, override, confirm+reason
2. **Stage 4** — finish hero, answer timer, question count in settings
3. **Podium** — `CompetitionPodium` 3 fixed columns
4. **History/Log merge** — single «السجل» tab; `editLogEntries` array on history doc
5. **Session start dialog** — version + governorate on competition start
6. **Confirm card** — unified for controls + history edits

---

## 22. كيف تبدأ AI جديدة

```
1. Read this entire file
2. npm install && npm run dev
3. Open /facilitator + /team in separate browsers
4. Firebase Console → competitions/main/system/gameFlow
5. For task X: use §15 file map + read those files
6. npm run typecheck before done
7. Update §20/§21 if architecture changed
```

**Golden rule:** `gameFlow.status` drives all screens. Start there.

---

## ملحق: خريطة ملفات حسب المهمة

| Task | Start files |
|------|-------------|
| Change flow/transitions | `facilitator-flow-plan.ts`, `facilitator-flow-actions.ts` |
| Facilitator UI | `facilitator-shell.tsx`, `facilitator-flow-panel.tsx` |
| Team admin | `facilitator-controls-tab.tsx`, `facilitator-team-admin.ts` |
| Session/history | `competition-session.ts`, `facilitator-history-tab.tsx` |
| Team screens | `team-shell.tsx`, `use-team-game-flow.ts` |
| Audience | `audience-shell.tsx` |
| Stage N logic | `features/stageN/` |
| Types | `types/index.ts` |
| Firestore paths | `firebase/firestore.ts` |
| Timers | `facilitator-timer-settings.ts`, `use-competition-timer.ts` |
| Scoring M3 | `stage3-scoring.ts` |
| Scoring M4 | `stage4-scoring.ts`, `confirm-stage4-answer.ts` |
| Reset | `competition-reset.ts`, `CompetitionResetPanel` |
| Auth | `firebase/auth.ts`, `hooks/use-auth-role.ts`, `auth-gate.tsx` |

---

*End of handoff document.*
