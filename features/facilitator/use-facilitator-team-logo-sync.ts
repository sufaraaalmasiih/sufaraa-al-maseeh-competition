"use client";

import { collection, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamStateRef } from "@/firebase/firestore";

/**
 * يملأ `logoUrl` في حالات الفرق العامة (teamStates) من ملفات الفرق (teams المقيّدة
 * بالميسّر). فالشعارات تظهر لكل الشاشات (الجمهور/المدرب/الفريق) — التي تقرأ teamStates
 * العامة فقط — حتى للفرق التي مُسح شعارها بإعادة ضبط سابقة، دون أن تعيد الفرق الدخول.
 *
 * يُشغَّل مرة واحدة عند فتح لوحة الميسّر (له صلاحية قراءة teams وكتابة teamStates).
 * عملية خفيفة (getDocs مرّة) متوافقة مع الباقة المجانية.
 */
export function useFacilitatorTeamLogoSync(enabled: boolean): void {
  const doneRef = useRef(false);

  useEffect(() => {
    if (!enabled || doneRef.current) {
      return;
    }
    doneRef.current = true;

    void (async () => {
      try {
        const db = getClientFirestore();
        const [teamsSnap, statesSnap] = await Promise.all([
          getDocs(collection(db, "teams")),
          getDocs(collection(db, "competitions", MAIN_COMPETITION_ID, "teamStates")),
        ]);

        const stateLogoById = new Map<string, unknown>();
        statesSnap.docs.forEach((docSnap) => {
          stateLogoById.set(docSnap.id, docSnap.data().logoUrl);
        });

        const updates = teamsSnap.docs
          .filter((docSnap) => {
            const logoUrl = docSnap.data().logoUrl;
            return (
              typeof logoUrl === "string" &&
              logoUrl.length > 0 &&
              stateLogoById.has(docSnap.id) &&
              typeof stateLogoById.get(docSnap.id) !== "string"
            );
          })
          .map((docSnap) =>
            updateDoc(teamStateRef(MAIN_COMPETITION_ID, docSnap.id), {
              logoUrl: docSnap.data().logoUrl as string,
              updatedAt: serverTimestamp(),
            }).catch(() => {
              // غير حرج — قد يفشل تحديث فريق واحد دون أن يؤثّر على الباقي.
            }),
          );

        await Promise.all(updates);
      } catch {
        // غير حرج: تعذّر المزامنة لا يُعطّل لوحة الميسّر.
      }
    })();
  }, [enabled]);
}
