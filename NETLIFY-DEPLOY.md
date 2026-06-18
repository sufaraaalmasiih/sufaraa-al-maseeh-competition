# نشر على Netlify أو Vercel + GitHub (خاص)

مستودع خاص للمسابقة — Firebase للبيانات فقط، Netlify أو Vercel للموقع، Cloudinary للشعارات.

---

## 1) إنشاء مستودع GitHub خاص

من جهازك في مجلد المشروع:

```powershell
cd C:\Users\ASUS\Documents\Codex\2026-05-30\codex-master-prompt-v1-sufaraa-al

git init
git add .
git commit -m "سفراء المسيح — نسخة المسابقة لـ Netlify"
```

على GitHub: **New repository** → اسم مثل `sufaraa-al-maseeh-competition` → **Private** → لا تضف README.

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USER/sufaraa-al-maseeh-competition.git
git push -u origin main
```

> **لا ترفع** `.env.local` — موجود في `.gitignore`.

---

## 2) ربط Netlify

1. [app.netlify.com](https://app.netlify.com) → تسجيل بالبريد
2. **Add new site** → **Import an existing project** → **GitHub**
3. اختر المستودع **الخاص**
4. Netlify يقرأ `netlify.toml` تلقائياً:
  - Build: `npm run build:netlify`
  - Plugin: `@netlify/plugin-nextjs`

---

## 3) متغيرات البيئة في Netlify

**مهم جداً:** متغيرات `NEXT_PUBLIC_`* يجب أن تكون متوفرة **أثناء البناء (Build)** وليس فقط Runtime — وإلا يفشل `npm run build:netlify` مع `auth/invalid-api-key`.

في Netlify: **Site settings** → **Environment variables** → **Add a variable**  
لكل متغير اختر **Scopes: All scopes** (أو Build + Runtime معاً).

### Firebase (عام — `NEXT_PUBLIC_`)


| Key                                        | Value                                       |
| ------------------------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSyCEjE9aNu2o0RFodEyjOeekodmzyGnrYnU`   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `sufaraaalmasiih-53478.firebaseapp.com`     |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `sufaraaalmasiih-53478`                     |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `sufaraaalmasiih-53478.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `118820359157`                              |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:118820359157:web:ded14cbe45cb2f5a5baebc` |


### Cloudinary (سري — بدون `NEXT_PUBLIC_`)


| Key                     | Value                                      |
| ----------------------- | ------------------------------------------ |
| `CLOUDINARY_CLOUD_NAME` | `dlugkeu8s`                                |
| `CLOUDINARY_API_KEY`    | `767352672477887`                          |
| `CLOUDINARY_API_SECRET` | *(من لوحة Cloudinary — لا تضعه في GitHub)* |


### Firebase Admin (سري — لحذف الفرق/الموظفين من API)


| Key                        | Value                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON كامل لحساب الخدمة (Service Account) — **Scopes: All scopes** |


> بدون `FIREBASE_SERVICE_ACCOUNT`، حذف الفريق/الموظف نهائياً من لوحة المشرف العام يفشل (500).

اضغط **Deploy** أو **Trigger deploy**.

---

## 4) بعد أول نشر — Firebase Auth

1. [Firebase Console](https://console.firebase.google.com/project/sufaraaalmasiih-53478/authentication/settings)  
2. **Authentication** → **Settings** → **Authorized domains**  
3. أضف نطاق الاستضافة، مثلاً:
   - Netlify: `sufaraaalmasiih.netlify.app`
   - Vercel: `sufaraa-al-maseeh-competition.vercel.app`

بدون هذه الخطوة تسجيل الدخول يفشل على الموقع المنشور.

### Vercel (ملخص سريع)

1. [vercel.com/new](https://vercel.com/new) → اختر المستودع  
2. **Build Command:** `next build`  
3. **Environment Variables:** نفس جدول Firebase و Cloudinary أدناه (من `.env.local`)  
4. **Deploy** ثم **Redeploy** بعد إضافة المتغيرات  
5. أضف نطاق `*.vercel.app` أو النطاق المحدد في Firebase Authorized domains  

**تسجيل الدخول:**
- ميسّر / مشرف عام: `/facilitator-login`
- مشرف عام فقط (بديل): `/admin-login`
- الحساب يجب أن يكون في **Firebase Authentication** + مستند `users/{uid}` بدور `facilitator` أو `super_admin`
- بريد Vercel/GitHub **ليس** بريد الدخول للمسابقة

---

## 5) تهيئة قاعدة البيانات (مرة واحدة)

1. أنشئ حساب `super_admin` في Firebase (Auth + Firestore `users/{uid}`)
2. افتح `https://YOUR-SITE.netlify.app/facilitator-login`
3. **الإعدادات** → **تهيئة قاعدة البيانات**

---

## 6) قائمة تحقق يوم المسابقة

- [ ] Netlify يبني بنجاح (Deploy log أخضر)  
- [ ] Authorized domain مضاف في Firebase  
- [ ] تهيئة DB تمت  
- [ ] `/audience` يفتح بدون login  
- [ ] تسجيل فريق + شعار (Cloudinary)  
- [ ] قواعد Firestore منشورة: `npm run firebase:deploy:rules`

---

## 7) تحديث الموقع لاحقاً

```powershell
git add .
git commit -m "وصف التعديل"
git push
```

Netlify يعيد النشر تلقائياً.

---

## استكشاف الأخطاء


| المشكلة           | الحل                                      |
| ----------------- | ----------------------------------------- |
| Build failed      | راجع Deploy log؛ تأكد `NODE_VERSION=22`   |
| Auth لا يعمل      | أضف `*.netlify.app` في Authorized domains |
| الشعار لا يُرفع   | تحقق من `CLOUDINARY_*` في Netlify env     |
| permission-denied | `npm run firebase:deploy`                 |


