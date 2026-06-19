"use client";

import { signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamStateRef } from "@/firebase/firestore";

/**
 * يسجّل خروج المتسابق ويعيده لصفحة الدخول إذا أخرجه الميسّر من المسابقة
 * (حُذفت حالة فريقه) أو حُذف الفريق بالكامل.
 *
 * ملاحظة: «إعادة الضبط» و«بدء مسابقة جديدة» تُعيد كتابة حالة الفريق (set) ولا تحذفها،
 * فلا يتأثر بها هذا الحارس — تلك الحالات يعالجها حارس reauthEpoch المنفصل.
 */
export function useTeamRemovalGuard(enabled: boolean): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      return;
    }

    let hadState = false;
    let handled = false;

    return onSnapshot(
      teamStateRef(MAIN_COMPETITION_ID, uid),
      (snapshot) => {
        if (snapshot.exists()) {
          hadState = true;
          return;
        }

        // كانت موجودة ثم اختفت = أُخرج الفريق من المسابقة (لا مجرد إعادة ضبط).
        if (hadState && !handled) {
          handled = true;
          void signOut(firebaseAuth)
            .catch(() => {})
            .finally(() => router.replace("/team-login?reason=removed"));
        }
      },
      () => {
        // تجاهل أخطاء القراءة — لا نُخرج المتسابق بسبب خطأ شبكة عابر.
      },
    );
  }, [enabled, router]);
}
