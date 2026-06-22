# سفراء المسيح — دليل المشروع الكامل لأي AI

> **الغرض:** مصدر handoff شامل لفهم المشروع والمتابعة دون سياق سابق.  
> **آخر تحديث:** 2026-06-22 — مُحقَّق مقابل الكود في `codex-master-prompt-v1-sufaraa-al`  
> **اللغة:** واجهة عربية RTL — الكود والمسارات بالإنجليزية.  
> **تنبيه صادق:** لا يوجد توثيق «100% مطلق» بدون قراءة الكود. هذا الملف يغطي **~95%** من ما يحتاجه AI. عند التعارض: **الكود wins**.

---

## 0) أحدث التغييرات — اقرأها أولاً

### 2026‑06‑22 (هذه الجلسة — كلها مدفوعة على `main`)

- **اعتراض المدرب — قبول/رفض:** بدّلنا «تمت المراجعة» بدورة قرار: `open → seen → accepted/rejected`. الميسّر يضغط **«تم مشاهدة الاعتراض»** ثم **«قبول»/«رفض»**؛ القبول يذكّره بتعديل النقاط يدوياً من تبويب التحكم. دوال جديدة في `features/facilitator/objections.ts` (`markObjectionSeen`, `setObjectionDecision`, `objectionStatusLabel`, `isObjectionDecided`) مع توافق رجعي: حالة `reviewed` القديمة تُقرأ كـ«تمت المشاهدة». تحديث العرض عند المدرب والسجل وأرشيف الفريق. **لا تحتاج نشر قواعد** (القواعد تسمح للميسّر بأي تحديث على الاعتراض).
- **تعديل النقاط — إرجاع لما قبل التعديل:** زر «إرجاع للقيم الحالية» صار **«إرجاع نقاط ما قبل التعديل»**. عند أوّل تعديل يدوي تُلتقط لقطة `scoreBaselineBeforeManual` في حالة الفريق (في `setTeamStageScores`)، والزر يستعيدها؛ وإن لم توجد لقطة يُعاد الحساب من الإجابات (`recompute-team-scores-from-answers.ts` + اختبارات) **دون تصفير** فريق له نقاط بلا إجابات. تُملأ الحقول فقط ثم يحفظ الميسّر.
- **المرحلة 3 — عند عدم اختيار سؤال:** في شاشة إعلان الجمهور أُزيل جدول الترتيب واستُبدل بـ**شعار الفريق + اسمه + «لم يختر سؤالاً»** مع إبقاء الخصم (مُرِّر `ownerTeamId` عبر `use-audience-shell-data.ts` + احتياط من خريطة الشعارات).
- **صور الفرق (تظهر للجميع):** كان `team-logos-store.ts` يقرأ من مجموعة `teams` المقيّدة بالميسّر فقط → خارج لوحة الميسّر تظهر أيقونة البديل. الآن المصدر **`teamStates` العامة**، مع: (أ) الحفاظ على `logoUrl` في حالة الفريق عبر إعادة الضبط/الاستعداد وإعادة الإنشاء/الدخول (`buildInitialTeamStateDocument` يقبل `logoUrl`، `competition-reset.ts` و`ensure-team-profile.ts` يمرّرانه/يعيدان ملأه)، (ب) **مزامنة من جهة الميسّر** (`use-facilitator-team-logo-sync.ts` مُركَّبة في `facilitator-shell.tsx`) تنسخ `logoUrl` من `teams` إلى `teamStates` لكل الفرق عند فتح اللوحة — فتظهر الشعارات حتى للفرق التي مُسح شعارها سابقاً دون إعادة دخولها. أُضيف `TeamLogoBadge` في لوحة الاعتراضات وجداول الفرق/النتائج وصفوف اعتراضات السجل وجدولَي تقدّم المرحلتين 2 و3.
- **المصادقة (الميسّر/المشرف):** حفظ آخر دور صحيح في `localStorage` وعدم إسقاط جلسة موظّف مُصرَّح له إلى `null` عند قراءة دور عابرة (`use-auth-role.ts`)؛ وطبقة bootstrap لم تعد تُعلن «غير مسجّل» إن لم يتوفّر مستخدم بعد (يحسمها `onAuthStateChanged`) — يمنعان ظهور «ليست لديك صلاحية»/«يلزم تسجيل الدخول» للميسّر/المشرف خطأً عند بداية المرحلة الأولى تحت الضغط.
- **بدء المسابقة يتطلّب جاهزية الفرق:** مرحلة `waiting_players` صارت مبوَّبة بمفتاح جاهزية `"ready"` — زر «بدء مقدمة المسابقة» مقفل حتى تضغط **كل** الفرق «جاهز» (`facilitator-flow-plan.ts` + `facilitator-readiness.ts`). التجاوز الطارئ عبر «تحكم يدوي متقدم» كبقية المراحل.

### 2026‑06‑21 (مدفوعة على `main`)

- **البنية التحتية (الأهم):** كانت كل مسارات `/api/admin/*` تنهار وقت التشغيل على Vercel بخطأ `ERR_REQUIRE_ESM` (سلسلة `firebase-admin` → `jwks-rsa@4` → `jose@6` نسخة ESM لا تقبل `require`) — وهو **السبب الحقيقي** لعدم عمل تغيير كلمات مرور الفرق والحذف من Authentication. الحلّ: تثبيت `jose` على `5.10.0` عبر `overrides` في `package.json`. كما نُقل `firebase-admin` إلى `dependencies`، وأُضيف اختبار دخان بعد النشر (`scripts/post-deploy-smoke.mjs` / `npm run smoke`) يتأكّد أنّ `/api/admin/*` ترجع 401 لا 500 (يُمسك أي تكرار لهذا النوع من الأخطاء الذي لا تكشفه `tsc` ولا `vitest`).
- **المصادقة:** إصلاح ظهور «ليست لديك صلاحية» مباشرة بعد تسجيل فريق/مدرب، والخروج المفاجئ للميسّر/المشرف على انقطاع شبكة لحظي — في `hooks/use-auth-role.ts`: لا يُخزَّن دور `null`/فاشل في الكاش (كان يُسمّم الجلسة)، مع إعادة محاولة، ودالّة `primeAuthRole` تُحقن الدور المعروف بعد التسجيل/الدخول.
- **اعتراض المدرب:** `firestore.rules` تسمح الآن للمدرب المرتبط بإنشاء/قراءة اعتراض لفريقه (`teamId == coachLinkedTeamId()`) — كان uid المدرب ≠ uid الفريق فيُرفض. **تحتاج نشر القواعد يدوياً.**
- **إدارة الحسابات:** لوحة جديدة **«حسابات المدربين»** (`facilitator-all-coaches-panel.tsx`) لعرض/تعديل/حذف المدربين عبر Admin SDK (مسارات `/api/admin/update-coach-credentials` و`/api/admin/delete-coach`). تُحفظ نسخة نصّية من كلمة المرور (`accountPasswordPlain` على `teams`/`coaches`) لعرضها للمشرف — **تنازل أمني مقصود بطلب المالك**، قراءته مقصورة على المالك/الميسّر في القواعد. حذف Auth يُظهر الآن **السبب الحقيقي** للفشل بدل رسالة «أضف FIREBASE_SERVICE_ACCOUNT» المضلِّلة.
- **تعديل النقاط:** محرّر نقاط **تفصيلي لكل فريق** من تبويب التحكم (`facilitator-controls-score-edit-panel.tsx` + `setTeamStageScores`): القيم مبدئياً = الحالية، سبب إلزامي، ويُسجَّل في الأرشيف. (تحديث الميسّر لـ`teamStates` غير محدود بسقف ±100 خلافاً للفريق.)
- **دورة الحياة:** «إنهاء المسابقة» يحذف الآن `teamStates` (`deleteAllTeamStates`) مطابقةً لـ«بدء جديدة» — فتختفي الفرق من السير/التحكم حتى تعيد الدخول.
- **شاشة الجمهور (م3/م4):** تظهر **كل الفرق** في الإعلان، ومن لم يُجِب/تخطّى يظهر كصفّ **«لم يجيب»** (`features/competition/merge-no-answer-rows.ts` + 3 اختبارات). أُزيلت لوحة الترتيب الصغيرة أسفل جدول الإجابات (زائدة).
- **تحجيم ذكي لترتيب الجمهور:** `hooks/use-auto-scroll-fit.ts` يحجّم لوحات ترتيب الجمهور تحجيماً **متّصلاً** لتملأ ارتفاع البروجكتر مهما كان عدد الفرق (بلا قفزات أحجام ثابتة، سقف 1 فلا تتضخّم القلّة)، مع تمرير تلقائي احتياطي للأعداد الضخمة. عمودان فعّالان من ≥8 فرق. يُستخدم `setTimeout` لا `rAF` ليعمل والتبويب في الخلفية.
- **المرحلة 2 «رتّب الآية»:** أُعيد بناء السحب بـ`framer-motion` Reorder — العنصر الممسوك يبقى مرئياً بالكامل ويتحرّك بسلاسة (بدل شبح HTML5 الشفّاف).
- **⚠️ قيد تشغيلي مهم (شاشة الجمهور والإجابات):** شاشة `/audience` عامة بلا تسجيل دخول، لكنّ استعلام إجابات الإعلان غير مُقيَّد بـ`visibleToAudience`، وقاعدة Firestore «ليست مرشّحاً»، فالزائر المجهول لا يقرأ إجابات الإعلان (تظهر كل الفرق «لم يجيب»). **الحلّ العملي:** افتح شاشة الجمهور **كتبويب على نفس متصفّح الميسّر/المشرف المسجَّل دخوله** (نفس المصدر = نفس الجلسة) ووصّله بالبروجكتر. الحلّ الجذري (لجهاز منفصل) يحتاج: ضبط `visibleToAudience=true` لإجابات م1/م2/م4 عند الإعلان (م3 تفعلها) + استعلام جمهور مُقيَّد + فهرس مركّب جديد.

### 2026‑06‑20

تغييرات مهمة على السلوك والصلاحيات (كلها مدفوعة على `main`):

- **صلاحيات RBAC:** الميسّر (`facilitator`) يبدأ **حصص تدريب فقط** ويعدّل الأسئلة/الإعدادات **في التدريب فقط**؛ المسابقات الرسمية وتعديل محتواها/إعداداتها **للمشرف العام** (`super_admin`). القاعدة في `features/facilitator/content-edit-permission.ts` (`resolveContentEditGate` = «مشرف عام أو وضع تدريب»). نافذة البدء تُخفي خيار «رسمية» عن الميسّر. تبويب «الإدارة» للمشرف فقط. الميسّر **يدير** المسابقة الرسمية (سير/تحكم) لكن لا يعدّل محتواها.
- **قفل أثناء التشغيل (منع غش):** عدد الأسئلة ومدد المؤقتات مقفولة للجميع أثناء مسابقة جارية (`assertCompetitionSettingsEditable` في `question-bank-lock.ts`).
- **إدارة الفريق نُقلت إلى تبويب «الإدارة»** (`facilitator-admin-team-management-panel.tsx`): تعديل الاسم/المحافظة/اللاعبين + **تغيير بريد/كلمة مرور الدخول الحقيقية** عبر `/api/admin/update-team-credentials` (Admin SDK). حذف الفريق الكامل يحذف حساب Auth أيضاً (`/api/admin/delete-team`). كلاهما يحتاج `FIREBASE_SERVICE_ACCOUNT` على Vercel/Production.
- **دورة حياة الفريق:** «بدء مسابقة جديدة» **يحذف** حالات الفرق (`deleteAllTeamStates`) فلا تظهر في السير/التحكم حتى تعيد الدخول؛ تُعاد إنشاء الحالة عند الدخول (`ensureTeamStateDoc` في `lib/ensure-team-profile.ts`) وقبل تسجيل الجاهزية. «الإخراج من المسابقة» يحذف حالة الفريق ويسجّل خروجه (`useTeamRemovalGuard`). حذف السجل يحذف نسخ أرشيف الفرق (`deleteSession`).
- **اعتراضات المدربين** تُحصر على المسابقة النشطة (`objectionsForActiveSession`) فتعود لصفر عند مسابقة جديدة، وتبقى في تبويب «السجل» حسب `sessionId`.
- **المرحلة 2 — التوصيل:** النقاط الآن **15 لكل زوج صحيح** (لا الكل‑أو‑لا‑شيء)، بحدّ 100 لكل كتابة (`confirm-stage2-matching-answer.ts` + `countCorrectMatchingPairs`).
- **المرحلة 2 — القراءة:** لا انتقال تلقائي إلى التوصيل؛ تظهر شاشة انتظار (`Stage2FieldWaitingScreen`) والميسّر يبدأ الأسئلة يدوياً بزر «بدء أسئلة المجالات». (أُزيل فرع stage2_reading من `facilitator-stage12-automation.tsx`.)
- **جماليات:** مؤثّرات صوتية (Web Audio: تكّة آخر 5ث + انتهاء الوقت + احتفال المنصّة) مع زر كتم لكل جهاز (`lib/competition-sound-cues.ts`, `features/competition/use-competition-sound-cues.ts`)؛ كونفيتي على المنصّة (`podium-confetti.tsx`)؛ ترتيب تراكمي على كشف الجمهور في المرحلة 4؛ لافتة تجميد وسطية حمراء بثلجة دوّارة؛ أنيميشن ساعة رملية في شاشات الانتظار؛ لمسات نقر للأزرار.
- **تنظيف:** حُذف مجلد `_ref-old-zip/` (نسخة قديمة منفصلة، كانت في deploy‑ignore).

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
23. [تحديثات يونيو 2026 — الدفعة الكبيرة](#23-تحديثات-يونيو-2026--الدفعة-الكبيرة-21-تعديل--اعتراضات--تحصين) ⭐ **اقرأه لمعرفة الحالة الحالية**

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
| waiting_players | → competition_intro | ready (كل الفرق ضغطت «جاهز») | no |
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
- [x] Excel export for final results (`exportFinalResultsExcel` — تبويب النتائج)
- [ ] Fix readiness field inconsistency (stage1 vs stage1Intro)
- [ ] Audience coverage for more statuses (currently many placeholders)
- [ ] README.md pointing to this file
- [ ] **انشر `firestore.rules`** بعد كل تعديل (الآن: objections + teamArchives)
- [ ] تشغيل اختبارات القواعد (`npm run test:rules`) يتطلب JDK 21+
- [ ] (اختياري) مؤشّر «سؤال جماعي» مرئي للفرق/الجمهور في م3

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

## 23. تحديثات يونيو 2026 — الدفعة الكبيرة (21 تعديل + اعتراضات + تحصين)

> **اقرأ هذا القسم بعد §1–§22 لفهم الحالة الحالية.** ما يلي يُكمّل/يُعدّل الأقسام السابقة.

### 23.1 الترتيب والتعادل (النقطتان 1،2)
- **ملف جديد:** `lib/competition-rank-assignment.ts` — `assignCompetitionRanks` (مراكز مشتركة 1,1,3) + `compareFinishSpeed`.
- كل `*-ranking.ts` + `use-final-results.ts` + `use-live-results.ts` تكسر التعادل بـ **من أنهى أسرع** (`progress.stageNFinishedAtMs`) ثم الاسم كحل أخير.
- **حقول teamState جديدة:** `progress.stage1FinishedAtMs` … `stage4FinishedAtMs` (تُكتب في كل confirm عبر `getSyncedNowMs()`).

### 23.2 المرحلة 2 (النقاط 3–7)
- ألوان التوصيل: `pair-0` صار **teal** (لا أزرق)، والبطاقة المختارة **رمادية داكنة عالية التباين** (`globals.css`).
- جدول الميسّر بلا scroll أفقي (`.flow-teams-table-wrap`).
- **نقاط جزئية لصح/خطأ:** عبارة صحيحة + «صح» = +15 فوراً؛ عبارة خاطئة + «خطأ» = **تحكيم الميسّر** على 3 خطوات (5+5+5).
  - **ملف جديد:** `features/stage2/grade-stage2-true-false-answer.ts` (`setStage2TrueFalseGradeStep`, `finalizeStage2TrueFalseGrading`).
  - **لوحة جديدة:** `features/stage2/components/stage2-true-false-grading-panel.tsx` (داخل `stage2-facilitator-panel.tsx`).
  - حقول answer جديدة: `facilitatorMarkedWrong`, `wrongPartIdentified`, `correctionApproved`, `needsGrading`, `gradingComplete`, `statementIsTrue`.

### 23.3 جولات التوصيل + مرونة Excel (النقاط 5،18،20)
- `MAX_MATCHING_PAIRS_PER_SCREEN = 5` في `question-bank-workbook-parser.ts` — أسئلة التوصيل >5 أزواج **تُقسَّم تلقائياً** لجولات (id يصبح `base-r1`, `base-r2`...).
- تغيير عمود `stage` ينقل السؤال بين المراحل (m1↔m3↔m4؛ m2 منفصل بأنواعه).
- اختبار: `features/facilitator/question-bank-workbook-parser.test.ts`.
- **تحذيرات:** عند الاستيراد إذا حقل/مرحلة فارغة (يظهر mock) + في الإعدادات عند تجاوز displayCount حجم البنك/لوحة الـ30.

### 23.4 المرحلة 3 (النقاط 8،14،15)
- **انتهاء وقت الاختيار يظهر للفريق والجمهور** (`stage3-team-reveal-screen.tsx` يستقبل `ownerTeamName`).
- **الأسئلة الزائدة الجماعية:** أسئلة لا تقسم على عدد الفرق تصبح جماعية بنقاط مسطّحة بلا أفضلية. منطق في `stage3-scoring.ts` (`getStage3LeftoverCount`, `isStage3CollectiveSelection`, `computeStage3PointsDelta(...collective)`)، علم `gameFlow.stage3ActiveQuestionCollective` يُضبط في `open-stage3-question.ts` ويُقرأ في `confirm-stage3-answer.ts`.

### 23.5 الأتمتة والتوقيت (النقاط 9،10،16)
- **المرحلة 4 مؤتمتة بالكامل** (مثل م3): فتح/إجابة/إغلاق/إعلان/انتقال على المؤقت. `facilitator-stage4-automation.tsx` + `features/gameflow/stage4-phase-timer.ts`؛ المؤقتات تُكتب في `start-stage4.ts`, `advance-stage4-question.ts`, `start-stage4-reveal.ts`.
- **مدد م4 الجديدة:** `stage4Selection`, `stage4Reveal` في `facilitator-timer-settings.ts` + تبويب الإعدادات.
- **العودة الاستثنائية تعيد المؤقت:** `features/facilitator/reset-timer-for-override.ts` (مُستدعى في `use-facilitator-controls-tab.ts`).

### 23.6 دورة حياة المسابقة (النقاط 11،12،21)
- **زر «إنهاء المسابقة»** في `final_results`/`podium` (`facilitator-flow-panel.tsx`) → `endCompetition()` في `competition-session.ts`: يؤرشف (رسمي) أو يمسح (تدريب) + يضبط `gameFlow.teamSignOutAt` لتسجيل خروج كل الفرق (`team-shell.tsx` يستمع له ويعيد لـ `/login`).
- **«إخراج من المسابقة»** (زر ثالث) = `removeTeamFromCompetition` (لا يحذف الحساب).
- **حوار البدء الجديد:** مسابقة رسمية / تدريب فقط (بلا نسخة/محافظة) — `facilitator-session-start-dialog.tsx`؛ `createCompetitionSession` يقبل قيماً افتراضية.

### 23.7 الأرشيف لكل فريق + الخصوصية (النقطة 13)
- **مجموعة Firestore جديدة:** `competitions/main/teamArchives/{sessionId}__{teamId}` — نسخة أرشيف لكل فريق (خصوصية). تُكتب في `saveSessionResults` عبر `writeTeamArchivesForSession` (في `use-team-archive.ts`).
- `history` عاد **للميسّر فقط**؛ الفريق يقرأ `teamArchives` الخاصة به.
- مكوّن `team-archive-panel.tsx` يُعرض في الميسّر/المدرب/شاشة انتظار الفريق (المستمعات **كسولة — تعمل عند الفتح فقط** لتوفير الباقة المجانية).

### 23.8 ميزة الاعتراضات (المدرب)
- **مجموعة:** `competitions/main/objections/{id}` — `features/facilitator/objections.ts` (`submitObjection`, `markObjectionSeen`, `setObjectionDecision`, `objectionStatusLabel`, `isObjectionDecided`, `useObjections`, `useTeamObjections`).
- المدرب يعترض على سؤال (أسباب شائعة: المرجع/إملائي/سؤال خاطئ + نص اختياري) من `coach-objection-form.tsx`؛ تظهر للميسّر في `facilitator-objections-panel.tsx` (تبويب التحكم) وتُحفظ في أرشيف الفريق وأرشيف المسابقة.
- **دورة القرار (تحديث 2026‑06‑22):** `open → seen → accepted/rejected`. الميسّر يضغط «تم مشاهدة الاعتراض» (`seen`) ثم «قبول»/«رفض»؛ القبول يعدّل النقاط يدوياً من تبويب التحكم. الحالة القديمة `reviewed` تُقرأ كـ`seen` (توافق رجعي). تحديث/حذف الاعتراض للميسّر فقط في القواعد — فلا حاجة لنشر قواعد لهذه الدورة.

### 23.9 الجمهور (النقطة 17)
- وضع ملء الشاشة يوسّع كل حاويات محتوى الجمهور لتملأ 100% (`html.audience-fullscreen-mode` في `globals.css`).

### 23.10 حقول/مجموعات Firestore الجديدة (ملخّص)
- `gameFlow`: `teamSignOutAt`, `stage3ActiveQuestionCollective`, `competitionMode`, `trainingEndsAtMs`, durations `stage4Selection`/`stage4Reveal`.
- `teamStates.progress`: `stageNFinishedAtMs`.
- `answers` (stage2 trueFalseCorrect): حقول التحكيم الخمسة.
- مجموعات جديدة: `teamArchives`, `objections`.
- **`firestore.rules` مُحدّثة** (objections, teamArchives privacy, history facilitator-only) — **يجب نشرها:** `npm run firebase:deploy:rules`.

### 23.11 الاختبارات والتوثيق
- `npm test` → 108 اختبار (منطق + محاكاة `features/__sim__/competition-simulation.test.ts` بأعداد فرق 3–40).
- `npm run test:rules` → اختبارات أمان القواعد عبر Emulator (يتطلب **JDK 21+**؛ محلي، بلا استهلاك حصة). انظر `tests/README.md`.
- `TRAINING-MODE-TEST-CHECKLIST.md` — فحص يدوي للتدفّقات الحيّة قبل أي مسابقة رسمية.

### 23.12 قرارات/قيود
- **مسابقة واحدة في آن** (المعرّف `main` ثابت) — **مقصود ومقبول** (المالك يُقيم مسابقات متتالية لا متزامنة). لا تقترح refactor لمسابقات متزامنة.
- اختبارات تكامل الـ Emulator هي الفجوة المتبقّية الوحيدة (تحتاج JDK 21+ لتشغيلها).

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
