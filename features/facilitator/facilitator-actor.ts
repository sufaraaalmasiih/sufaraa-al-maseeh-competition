import { firebaseAuth } from "@/firebase/firebaseClient";

/** اسم الميسّر/المشرف الحالي للعرض في السجلات والأرشيف. */
export function getFacilitatorActorName(): string {
  const user = firebaseAuth.currentUser;
  return user?.displayName?.trim() || user?.email?.split("@")[0] || "ميسر";
}
