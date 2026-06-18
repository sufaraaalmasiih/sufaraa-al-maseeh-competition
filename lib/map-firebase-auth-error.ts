import { FirebaseError } from "firebase/app";

export function mapFirebaseAuthError(error: unknown): string | null {
  if (!(error instanceof FirebaseError)) {
    return null;
  }

  switch (error.code) {
    case "auth/unauthorized-domain":
      return "هذا النطاق غير مصرّح به في Firebase. أضف نطاق الاستضافة (مثل your-app.vercel.app) في Authentication → Authorized domains.";
    case "auth/invalid-api-key":
    case "auth/invalid-credential":
      return null;
    case "auth/network-request-failed":
      return "تعذر الاتصال بخدمة المصادقة. تحقق من الإنترنت ثم حاول مرة أخرى.";
    case "auth/too-many-requests":
      return "محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.";
    case "auth/user-disabled":
      return "هذا الحساب معطّل. تواصل مع المشرف العام.";
    default:
      return null;
  }
}
