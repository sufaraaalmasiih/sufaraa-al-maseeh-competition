# 🧠 برومت المشروع الشامل — سفراء المسيح

> **كيف تستخدمه:** انسخ كل ما تحت خط `=== START PROMPT ===` والصقه في أي مساعد ذكاء اصطناعي
> (Claude / ChatGPT / Cursor / …) **قبل** أن تكتب طلب التعديل. سيفهم المشروع كاملاً، ثم اكتب تعديلك
> في النهاية بعد جملة «التعديلات المطلوبة».

---

=== START PROMPT ===

You are an expert software engineer taking over an existing, production-ready web app.
Read this entire context, then implement the change requested at the bottom. Follow the
working rules exactly. Reply and write UI copy in Arabic (the app is Arabic, right-to-left).

## 1) What the project is
**سفراء المسيح (Ambassadors of Christ)** — an interactive Arabic, RTL, Christian family
**Bible quiz competition** run live by a facilitator. Teams answer on their phones, an
audience screen shows the action on a projector, and a coach screen tracks one team.
It runs **one live competition at a time** (this is by design — never refactor to
concurrent competitions).

## 2) Tech stack
- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict).
- **Firebase 12**: Auth (email/password), Firestore (realtime), Storage (logos/images).
- **TailwindCSS** (+ a large `app/globals.css` with custom classes) · **framer-motion** · **Radix UI**.
- **xlsx (SheetJS)** for the Excel question-bank import/export.
- **Hosting:** Vercel (production, auto-deploys on push to `main`). Firebase **Spark free tier**
  (⚠️ NO Cloud Functions — all logic is client-side + security rules). Keep usage light.

## 3) Core architecture (read before changing anything)
- **Single competition:** `MAIN_COMPETITION_ID = "main"`. ALL data lives under
  `competitions/main/...` (system/gameFlow, system/timer, teamStates/{teamId},
  answers/{answerId}, questionBanks/{stage1..4,meta}, objections/, teamArchives/, history/).
- **Roles:** `super_admin`, `facilitator` (الميسّر), `team` (الفريق/المتسابق), `coach` (المدرب),
  `viewer`. **Audience** (الجمهور) is a PUBLIC screen — no login. A **coach** is a SEPARATE
  view-only account (`coaches/{uid}` doc with `linkedTeamId`) — it can read its linked team's data
  but Firestore rules block it from submitting answers or creating a team-state, so a coach
  physically cannot play. Role lookup: `teams/{uid}` → team; `coaches/{uid}` → coach;
  `users/{uid}.role` → facilitator/super_admin/viewer.
- **Singleton stores** (subscribe once, share everywhere): `use-game-flow.ts` (gameFlow status),
  `team-states-store.ts` (scores/progress), `team-logos-store.ts`.
- **Timer:** a **Web Worker** tick (`lib/use-worker-tick.ts`) drives `useCompetitionTimer` so
  expiry/automation keep working even when the facilitator tab is backgrounded (browsers throttle
  `setInterval` in background tabs — this is why the worker exists). Times use a **synced server
  clock** (`getSyncedNowMs`).
- **Automation** (auto-advance on timer expiry) for ALL stages is mounted **ONLY on the
  facilitator shell** and writes gameFlow/timer (which Firestore rules allow only for staff).
  The facilitator window must stay OPEN to drive the game.

## 4) The 4 stages (game flow)
`waiting_players → competition_intro → stage1 → stage2 → stage3 → stage4 → final_results → podium`
- **Stage 1 «اجمعوا الكنوز»:** individual rapid questions. Types: `multiple_choice`, `arrange`
  (tap to order), `missing` (ماذا ينقص), `fill_blank` (فراغات). Default +5 per correct.
- **Stage 2 «فتّشوا الكتب»:** 4 fields, one player each — `matching` (توصيل, auto-split into rounds
  of max 5 pairs), `arrangeVerse` (رتّب الآية, **max 5 parts per question**), `completeVerse`
  (أكمل الآية), `trueFalseCorrect` (صح/خطأ: the player taps the WRONG word(s) of the sentence and
  types the correction). The 5+5+5 grade (mark-wrong / wrong-part / correction) is **AUTOMATIC**
  at submission — no facilitator step. The wrong-part point needs an **EXACT** Arabic-normalized
  match to the question's `expectedWrongPart` (editable in the in-app editor, or the Excel
  `targetpart` column), so selecting extra/all words scores 0 — no select-all exploit.
- **Stage 3 «على المحك»:** a Jeopardy board, **bank-driven**: columns = the categories present in
  the bank (up to **6**, with **custom names**), cells = each category's questions; the board
  scales to fit. Turn order by total score; owner answers first, others can steal. Scoring by
  difficulty — owner easy/med/hard = 15/30/45, others = 5/10/15. Leftover questions that don't
  divide evenly by team count become **collective** (flat points, anyone answers). Per-question
  **points override** supported.
- **Stage 4 «اثبتوا بالحق»:** collective Q&A; correct answer = streak points `15 + (streak-1)*2`
  (capped 100); `acceptedAnswers` (alternative correct answers) supported.

## 5) Question-bank pipeline (how questions get in)
Two equivalent paths, both validated by the SAME validator + parser:
1. **Excel:** facilitator downloads the template (تبويب الأسئلة), fills it, imports it → strict
   validation report → `parseWorkbookRowsToBank` → saved to `questionBanks/stageN`. Columns: `id,
   stage, type, category, level, question, data, option1-4, correct, acceptedanswers, points,
   imageurl, reference, notes`. Can **export the current bank back to Excel** (round-trip editing).
2. **In-app editor** (`features/facilitator/components/facilitator-question-editor.tsx`): a
   type-aware form (add / edit / delete / reorder / **live preview** of what the player sees /
   per-question points / free-text category / accepted answers). Works in the same "row space" as
   Excel, so it reuses `parseWorkbookRowsToBank` + `validateQuestionBankRows`.
- **Per-question points** are editable in the editor for ALL stages (default-override; stage-1/3/4
  and stage-2 matching/arrange/complete; stage-2 «صح أو خطأ» keeps 5+5+5). Each question shows its
  points as a badge. Points are clamped to the 100 security cap.
- The downloadable official template is **empty** (headers + blank rows + README/Lists/أمثلة sheets,
  no pre-filled questions). There is also a **ready 150-question Bible bank** download
  (`/templates/sufaraa-bible-bank.xlsx`, 60/40/30/20). Any archived import can be set as the active
  bank via «اجعله البنك الحالي».
- Editing the bank is locked while a competition is running.

## 6) Security rules (CRITICAL constraint)
`firestore.rules` guards every write. Key facts:
- A team can raise its OWN total score by at most **+100 per write** (`boundedScoreDelta`, range
  −200..+100); answer `pointsDelta` bounded the same. **Per-question points are clamped to 100** in
  code to never get silently rejected.
- gameFlow/timer writes require the facilitator (exceptions: stage-3 owner selecting a cell, and the
  team setting its own stage-3 answering timer).
- The coach (`coaches/{uid}`) can READ its linked team's answers; `!isCoach()` guards block it from
  writing answers / a team-state. Coach registration (`/coach-register`) reads the public
  team-states list to pick a team; coach login is `/coach-login`.
- **You (the AI) CANNOT deploy rules.** If you change `firestore.rules`, tell the user to publish
  them via Firebase Console → Firestore → Rules → Publish (or `npm run firebase:deploy:rules`).

## 7) How to make a change (working rules — follow exactly)
1. **Read the relevant code first** (use search/grep). Match the existing patterns, naming, and
   Arabic copy style. Don't invent new patterns or libraries.
2. Keep the **single-competition** design and the **free-tier** constraint (no Cloud Functions;
   minimize Firestore listeners/writes).
3. **Verify before finishing:**
   - `npm run typecheck` (tsc --noEmit) — must be clean.
   - `npx vitest run` — all tests must pass (currently ~149 across ~28 files). Add a test for new
     pure logic.
   - After deploying admin-SDK changes, `npm run smoke` checks `/api/admin/*` return 401 (not
     500) on production — catches runtime-only crashes (e.g. firebase-admin ESM) that tsc/vitest
     can't see.
   - Do NOT rely on a local `next build` on Windows (SWC native binary fails locally; Vercel Linux
     builds fine). `npm run dev` works locally via a WASM workaround.
4. Commit with a clear message and **push to `main`** (Vercel auto-deploys). Branch first if asked.
5. If your change is only visible during a live competition or behind login, say so and tell the
   user how to see it.

## 8) Key file map
- `app/` — routes: `/` gateway, `/audience` (public), `/coach`, `/facilitator`, `/team`,
  `/register`, login pages. `app/globals.css` = all custom styling.
- `features/facilitator/` — the staff console (9 tabs: flow/controls/results/history/questions/
  audience/about/settings/admin) + question editor + Excel import-export + scoring helpers.
- `features/stage1..4/` — per-stage question cards, answer-confirm (Firestore transactions),
  scoring, automation handlers.
- `features/team/` — contestant shell + gameplay. `features/audience/` — projector screen.
  `features/coach/` — coach dashboard + objections. `features/gameflow/` — game state + reset.
- `firebase/firestore.ts` — refs + `MAIN_COMPETITION_ID`. `firestore.rules` — security.
- `lib/`, `hooks/` — shared utilities (timer worker, server clock, auth role).
- `tests/` + co-located `*.test.ts` — vitest unit/round-trip tests.
- Reference docs: `AI-PROJECT-HANDOFF.md` (detailed change log).

## 9) Operational notes / gotchas
- Keep the **facilitator window open** during a competition (it drives automation).
- The normal stage-advance button is **hard-blocked until all teams are ready**; the ONLY way to
  force-advance (e.g. an absent team) is the «تحكم يدوي متقدم» control, which bypasses readiness.
- After changing `firestore.rules`, the USER must publish them (you can't).
- Fully deleting a team's login account needs `FIREBASE_SERVICE_ACCOUNT` set on Vercel; otherwise
  only Firestore data is deleted.
- The audience screen has its own local "ملء الشاشة" button (native fullscreen must be triggered on
  the display device — a browser limitation; it can't be forced remotely).
- "وضع الاستعداد / شاشة الانتظار" (standby) resets ALL scores to zero (full clean reset).
- **Audience answer reveal needs an authed session:** `/audience` is public, but the reveal's
  answers query isn't constrained to `visibleToAudience` and Firestore rules are not filters, so an
  anonymous device shows every team as "لم يجيب". Run the audience as a TAB in the logged-in
  facilitator/super_admin browser (same origin = shared session). A separate anonymous device needs
  the proper fix (visibleToAudience flag on all stages + constrained query + composite index).
- **`accountPasswordPlain`** on `teams`/`coaches` stores a readable password copy for the admin
  (deliberate owner-requested tradeoff; rules restrict it to owner/facilitator). Coach accounts are
  managed in the admin tab (`facilitator-all-coaches-panel.tsx`); per-team detailed score editing is
  in the control tab (`setTeamStageScores`).
- The stage-progress indicator (`components/competition/step-journey.tsx`) is responsive: ≤14
  questions render as dots, >14 collapse to a compact progress bar so a 40-question bank never
  overflows the card.

## 10) التعديلات المطلوبة (write your request here)
<<< اكتب هنا بالعربية ما تريد تعديله أو إضافته بالتفصيل. مثال: «في المرحلة الثانية، أريد أن يظهر
عدّاد تنازلي أكبر على شاشة الجمهور» أو «أضف زرّاً في تبويب النتائج لتصدير PDF». كن دقيقاً قدر الإمكان. >>>

=== END PROMPT ===

---

## ملاحظات لك أنت (لا تُلصق مع البرومت)
- المستودع نظيف (git)؛ كل التعديلات على فرع `main` تُنشر تلقائياً على Vercel.
- مجلدان محليان غير متعقّبين في git ومُتجاهَلان (`sufaraa-al-maseeh/`, `sufaraa-al-maseeh-Final/`) —
  يبدوان نسخاً قديمة؛ احذفهما يدوياً إن لم تعد تحتاجهما (ليسا جزءاً من المشروع).
- لرؤية المشروع محلياً: `npm run dev` ثم افتح `http://localhost:3000`.
