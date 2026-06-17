# خطة الأشياء الناقصة — سفراء المسيح

> **آخر تحديث:** يونيو 2026  
> **المصدر:** مُحقَّق مقابل `AI-PROJECT-HANDOFF.md` والكود  
> **المستودع:** https://github.com/raffinazarian021-maker/sufaraa-al-maseeh-Final

---

## كيف تستخدم هذا الملف

- **P0** = أمان واستقرار — ابدأ هنا
- **P1** = ميزات مطلوبة للإنتاج
- **P2** = تحسين تجربة المستخدم
- **P3** = تنظيف وصيانة

عند إنجاز مهمة: ضع `[x]` بدل `[ ]` وحدّث `AI-PROJECT-HANDOFF.md` §20 إذا تغيّرت المعمارية.

---

## P0 — أمان واستقرار

| # | المهمة | الحالة | التفاصيل | ملفات البداية |
|---|--------|--------|----------|---------------|
| 1 | Firestore Security Rules | [x] | `firestore.rules` + `firebase.json` | |
| 2 | توثيق deploy للـ Rules | [x] | `FIREBASE-DEPLOY.md` | |
| 3 | إصلاح readiness | [x] | `stage1Intro: false` في `buildInitialTeamStateDocument` | `firebase/firestore.ts`, `types/index.ts` |
| 4 | حد editLogEntries | [x] | حد 150 entry + transaction بدل arrayUnion | `competition-session.ts` |
| 5 | مراجعة `.env.local` | [x] | موجود في `.gitignore` | `.gitignore` |

---

## P1 — ميزات مطلوبة

| # | المهمة | الحالة | التفاصيل | ملفات البداية |
|---|--------|--------|----------|---------------|
| 6 | دور `viewer` | [ ] | موجود في types بدون login واضح — إزالة أو UI | `types/index.ts`, `get-user-role.ts`, `auth-gate.tsx` |
| 7 | تغيير كلمة مرور الفريق | [ ] | يحتاج Firebase Admin SDK (حالياً email فقط) | `firebase/`, API route |
| 8 | تصدير Excel للنتائج | [ ] | من تبويب النتائج — تصدير ترتيب الفرق | `facilitator-results-tab.tsx` |
| 9 | README.md | [ ] | يوجّه إلى HANDOFF + خطوات clone وتشغيل | `README.md` |
| 10 | Storage Rules | [ ] | إن وُجد رفع ملفات — rules غير في الrepo | Firebase Console |

---

## P2 — تجربة المستخدم

| # | المهمة | الحالة | التفاصيل | ملفات البداية |
|---|--------|--------|----------|---------------|
| 11 | شاشة الجمهور — statuses عامة | [ ] | كثير من الحالات = `GameFlowPlaceholder` فقط | `audience-shell.tsx`, `gameflow-copy.ts` |
| 12 | Stage 3 audience | [ ] | بعض الحالات = `Stage3AudiencePlaceholder` | `features/stage3/components/stage3-audience-*` |
| 13 | Stage 2 audience | [ ] | شاشة قراءة أساسية — محتوى أغنى | `audience-stage2-reading.tsx` |
| 14 | شاشة الفريق — النتائج/البوديوم | [ ] | مراجعة `useStage1Ranking` vs النتائج النهائية | `team-shell.tsx` |
| 15 | Stage 2 gameplay | [ ] | placeholder «سيتم بناء أسئلة هذا المجال» في docs | `features/stage2/` |
| 16 | بدون activeSessionId | [ ] | تعديلات التحكم لا تظهر في editLog — UX أو تحذير | `facilitator-team-admin.ts` |
| 17 | قفز يدوي لـ competition_intro | [ ] | محظور بدون session — توضيح للميسر | `facilitator-flow-actions.ts` |

---

## P3 — تنظيف وصيانة

| # | المهمة | الحالة | التفاصيل |
|---|--------|--------|----------|
| 18 | مجلدات clone محلية | [ ] | حذف `sufaraa-al-maseeh/` و `sufaraa-al-maseeh-Final/` داخل المشروع |
| 19 | ملفات `.log` محلية | [ ] | موجودة في `.gitignore` — حذف من الجهاز |
| 20 | repo GitHub مكرر | [ ] | حذف `codex-master-prompt-v1-sufaraa-al` (اختياري — نفس المحتوى) |
| 21 | أرشفة docs | [ ] | `docs/` و `_knowledge/` مرجعية — لا تعاملها كمصدر حقيقة |
| 22 | `_ref-old-zip/` | [ ] | مرجع قديم — أرشفة أو حذف من clone |

---

## ترتيب الجلسات المقترح

```
الجلسة 1  →  P0: Firestore Rules + readiness fix
الجلسة 2  →  P1: viewer + README
الجلسة 3  →  P1: Excel export + كلمة مرور الفريق
الجلسة 4  →  P2: شاشة الجمهور (statuses ناقصة)
الجلسة 5  →  P2: Stage 2/3 audience polish
الجلسة 6  →  P3: تنظيف المجلدات والـ repos
```

---

## Edge cases (مرجع سريع)

| Issue | Detail |
|-------|--------|
| No active session | Control edits won't appear in session editLog |
| Manual jump to competition_intro | Blocked without activeSessionId |
| super_admin | Can use `/facilitator` AND `/admin` |
| Same browser multi-role | Firebase Auth shared — use separate browsers |
| Old history docs | May lack version/hostGovernorate/editLogEntries |
| Firestore rules | Not in repo — verify in Firebase Console |

---

## ما تم إنجازه (لا تعيده)

- [x] تبويب التحكم — rebuild كامل
- [x] المرحلة 4 — finish hero + مؤقت + عدد أسئلة
- [x] البوديوم — `competition-podium.tsx`
- [x] السجل — تبويب واحد + `editLogEntries`
- [x] بدء مسابقة — dialog (نسخة + محافظة)
- [x] GitHub — `sufaraa-al-maseeh-Final` (430 ملف، بدون cache/log)
- [x] `AI-PROJECT-HANDOFF.md` + `AI-START-PROMPT-FINAL.md`

---

## روابط مفيدة

| الملف | الغرض |
|-------|--------|
| `AI-PROJECT-HANDOFF.md` | دليل المشروع الكامل |
| `AI-START-PROMPT-FINAL.md` | برومبت Cursor جديد |
| `AI-CONTINUE-PROMPT.md` | برومпт مختصر للمتابعة |

---

*حدّث هذا الملف عند إنجاز مهمة أو اكتشاف نقص جديد.*
