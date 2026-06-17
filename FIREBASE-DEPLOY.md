# نشر Firebase — سفراء المسيح

دليل كامل: إنشاء قاعدة البيانات (خطة مجانية/محدودة) + نشر القواعد + App Hosting + فحص شامل.

**المشروع:** `sufaraaalmasiih-53478`

---

## المرحلة 1 — تفعيل الخدمات (مرة واحدة)

من [Firebase Console](https://console.firebase.google.com/project/sufaraaalmasiih-53478):

### 1) Firestore

1. **Build → Firestore Database → Create database**
2. اختر **Production mode** (القواعد من `firestore.rules` في المشروع)
3. المنطقة: الأقرب للأردن (مثلاً `europe-west1` أو `me-west1` إن وُجدت)
4. **لا تحتاج بيانات يدوية** — التطبيق يهيئها من لوحة الميسّر

### 2) Authentication

1. **Build → Authentication → Get started**
2. فعّل **Email/Password** فقط

### 3) Storage (لشعارات الفرق)

1. **Build → Storage → Get started**
2. نفس منطقة Firestore إن أمكن

### 4) App Hosting (الاستضافة)

1. **Build → App Hosting → Create backend**
2. اربط GitHub أو انشر عبر CLI
3. أضف متغيرات البيئة (انظر §3)

> **خطة Spark (مجانية):** Firestore + Auth + Storage تعمل ضمن الحصة المجانية.  
> **App Hosting** قد يتطلب **Blaze** — راقب الاستهلاك؛ `apphosting.yaml` مضبوط على `minInstances: 0` لتقليل التكلفة.

---

## المرحلة 2 — نشر القواعد والفهارس

```powershell
cd C:\Users\ASUS\Documents\Codex\2026-05-30\codex-master-prompt-v1-sufaraa-al
firebase login
firebase use sufaraaalmasiih-53478
firebase deploy --only firestore:rules,firestore:indexes,storage
```

انتظر حتى تكتمل فهارس `answers` (قد تستغرق دقائق في Console → Firestore → Indexes).

---

## المرحلة 3 — متغيرات App Hosting

في **App Hosting → Backend → Environment variables** أضف من `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sufaraaalmasiih-53478.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sufaraaalmasiih-53478
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sufaraaalmasiih-53478.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

ثم **Deploy** من App Hosting (أو push إلى الفرع المربوط).

---

## المرحلة 4 — تهيئة قاعدة البيانات (بدون Console يدوي)

بعد النشر وإنشاء أول حساب ميسّر:

1. افتح `https://YOUR-BACKEND.web.app/facilitator-login`
2. سجّل دخول الميسّر
3. تبويب **الإعدادات** → **تهيئة قاعدة البيانات** → اضغط الزر

يُنشئ تلقائياً (إن لم تكن موجودة):

| المستند | المسار |
|---------|--------|
| سير المسابقة | `competitions/main/system/gameFlow` |
| المؤقت | `competitions/main/system/timer` |
| الجلسة | `competitions/main/system/session` |
| شاشة الجمهور | `competitions/main/system/audienceDisplay` |
| ميتا البنك | `competitions/main/questionBanks/meta` |

**آمن للتكرار** — لا يحذف بيانات موجودة.

---

## المرحلة 5 — أول حساب ميسّر (إنتاج)

صفحة `/dev/create-admin-user` **غير متاحة في الإنتاج**.

### الطريقة اليدوية (مرة واحدة):

1. **Authentication → Add user** (بريد + كلمة مرور)
2. انسخ **UID**
3. **Firestore → Start collection** `users` → document ID = UID:

```json
{
  "role": "super_admin",
  "fullName": "المشرف العام",
  "email": "admin@example.com",
  "createdAt": "<timestamp>"
}
```

4. سجّل دخول من `/facilitator-login`
5. من تبويب **إدارة النظام** أنشئ حسابات الميسّرين
6. من **الإعدادات** → **تهيئة قاعدة البيانات**

---

## المرحلة 6 — فحص شامل بعد النشر

| # | الاختبار | النتيجة المتوقعة |
|---|----------|----------------|
| 1 | `/audience` بدون login | شاشة انتظار / لا أخطاء Firebase |
| 2 | `/login` | بوابة الدخول تفتح |
| 3 | تسجيل فريق جديد `/register` | يُنشأ `teams/{uid}` + `teamStates/{uid}` |
| 4 | `/team` بعد login | لوحة الفريق + مزامنة `gameFlow` |
| 5 | `/facilitator` | لوحة الميسّر + تهيئة DB إن لزم |
| 6 | الميسّر → شاشة الانتظار | `status: waiting_players` على الجمهور |
| 7 | `/coach` بحساب فريق | ملخص النقاط والمرحلة |
| 8 | استيراد بنك أسئلة (Excel) | `questionBanks/stage1..4` |
| 9 | مرحلة 3 — فريق صاحب الدور | اختيار سؤال بعد انتهاء مؤقت الاختيار |
| 10 | تجميد المسابقة | توقف المؤقت + رفض الإجابات |

---

## ملخص الصلاحيات (بعد آخر تحديث)

| المسار | قراءة | كتابة |
|--------|-------|--------|
| `competitions/*/system/*` | عام (جمهور) | ميسّر |
| `competitions/*/teamStates/*` | عام | فريقه (نقاط محدودة) / ميسّر |
| `competitions/*/answers/*` | فريقه / مكشوف للجمهور / ميسّر | فريق (محدود) / ميسّر |
| `competitions/*/questionBanks/*` | مسجّل | ميسّر |
| `teams/{uid}` | المالك / ميسّر | المالك / ميسّر |
| `users/{uid}` | المالك / ميسّر | مشرف عام فقط |

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `لم يتم العثور على إعدادات سير المسابقة` | الإعدادات → تهيئة قاعدة البيانات |
| `permission-denied` | `firebase deploy --only firestore:rules` |
| فهرس `answers` ناقص | انتظر Indexes في Console أو أعد deploy |
| env لا تعمل بعد deploy | Redeploy من App Hosting بعد حفظ المتغيرات |
| Auth يفشل | تحقق من `AUTH_DOMAIN` و Email/Password مفعّل |

---

## أوامر سريعة

```powershell
npm run build          # تحقق محلي قبل النشر
npm run test           # 41 اختبار
firebase deploy --only firestore:rules,firestore:indexes,storage
```

راجع أيضاً: `HOSTING.md`
