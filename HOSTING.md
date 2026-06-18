# نشر التطبيق — Firebase فقط

التطبيق يُنشر على **Firebase App Hosting**. البيانات (Firestore + Auth) على نفس مشروع Firebase.

---

## الروابط بعد النشر

| الشاشة | المسار |
|--------|--------|
| بوابة الدخول | `/login` |
| الفريق | `/team` |
| المدرب | `/coach` |
| الميسّر | `/facilitator` |
| الجمهور | `/audience` |

مثال: `https://YOUR-BACKEND.web.app/login` — **نفس الرابط للجميع**.

---

## 1) متغيرات البيئة

```powershell
copy .env.example .env.local
```

املأ من [Firebase Console](https://console.firebase.google.com/project/sufaraaalmasiih-53478):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sufaraaalmasiih-53478.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sufaraaalmasiih-53478
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sufaraaalmasiih-53478.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 2) التطوير المحلي

```powershell
npm run dev
# أو بعد build: npm run dev:clean
```

يفتح: `http://localhost:3000/login`

---

## 3) النشر على Firebase App Hosting

### أ) إعداد تلقائي (مرة واحدة)

1. **فعّل Blaze:** [ترقية المشروع](https://console.firebase.google.com/project/sufaraaalmasiih-53478/usage/details)
2. **فعّل Storage** (للشعارات): [Storage → Get started](https://console.firebase.google.com/project/sufaraaalmasiih-53478/storage)
3. من جذر المشروع:

```powershell
npm run firebase:setup:apphosting
```

4. في Console → **App Hosting → sufaraa-web → Settings** → اربط GitHub → فرع `main` → Rollout

### ب) أو يدوياً من Console

1. [Firebase Console](https://console.firebase.google.com/project/sufaraaalmasiih-53478) → **App Hosting** → Create backend (`sufaraa-web`)
2. اربط مستودع GitHub → فرع `main`
3. المتغيرات مضبوطة في `apphosting.yaml` — الأسرار تُرفع عبر السكربت أعلاه

```powershell
npm run firebase:deploy:apphosting
```

الملفات: `apphosting.yaml`, `firebase.json`

---

## 4) قواعد Firestore و Storage + تهيئة DB

```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage
```

**قاعدة بيانات جديدة؟** بعد أول login للميسّر: `/facilitator` → **الإعدادات** → **تهيئة قاعدة البيانات**.

التفاصيل الكاملة: `FIREBASE-DEPLOY.md`

---

## 5) قائمة تحقق يوم المسابقة

- [ ] App Hosting منشور ويعمل
- [ ] `NEXT_PUBLIC_FIREBASE_*` مضبوطة في Firebase Console
- [ ] Rules منشورة (`firebase deploy`)
- [ ] جرّب `/audience` و `/team` من جوال على Wi‑Fi أو 4G
- [ ] **إنternet متاح** — Firebase يحتاج اتصال للمزامنة الحية

---

## 6) استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `ERR_CONNECTION_REFUSED` محلياً | `npm run dev` غير شغّال |
| Firebase لا يتصل | تحقق من `.env.local` / متغيرات App Hosting |
| 500 بعد deploy | راجع logs في Firebase Console → App Hosting |
| تغيير env لا يظهر | Redeploy من App Hosting |

---

## الملفات

| الملف | الغرض |
|-------|--------|
| `apphosting.yaml` | إعداد App Hosting |
| `FIREBASE-DEPLOY.md` | نشر Firestore rules |
| `.env.example` | قالب مفاتيح Firebase |
