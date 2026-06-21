"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import { registerCoach } from "@/firebase/auth";
import { primeAuthRole } from "@/hooks/use-auth-role";

interface TeamOption {
  id: string;
  name: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "هذا البريد مستخدم بالفعل. سجّل الدخول أو استخدم بريداً آخر.";
    }
    if (error.code === "auth/invalid-email") {
      return "صيغة البريد غير صحيحة.";
    }
    if (error.code === "auth/weak-password") {
      return "كلمة المرور ضعيفة (6 أحرف على الأقل).";
    }
  }
  return "تعذّر إنشاء حساب المدرب. حاول مرة أخرى.";
}

export function CoachRegisterForm() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        const list = snapshot.docs
          .map((entry) => ({
            id: entry.id,
            name: typeof entry.data().teamName === "string" ? entry.data().teamName : entry.id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "ar"));
        setTeams(list);
      },
      () => setTeams([]),
    );
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || password.length < 6 || !teamId) {
      setError("املأ كل الحقول (كلمة المرور ٦ أحرف على الأقل) واختر فريقك.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const team = teams.find((entry) => entry.id === teamId);
      const { uid } = await registerCoach({
        name: name.trim(),
        email: email.trim(),
        password,
        linkedTeamId: teamId,
        linkedTeamName: team?.name ?? "",
      });
      // Seed the coach role so /coach does not race the just-written doc (#5).
      primeAuthRole(uid, "coach");
      router.push("/coach");
    } catch (submitError) {
      setError(errorMessage(submitError));
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#143A5A]";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-3xl border border-[#E2E8F0] bg-white/95 p-6 shadow-xl">
        <p className="text-sm font-black text-[#2388C4]">سفراء المسيح</p>
        <h1 className="mt-1 text-2xl font-black text-[#143A5A]">تسجيل حساب مدرب</h1>
        <p className="mt-2 text-sm font-semibold text-[#5A6B7D]">
          حساب المدرب <strong>للعرض فقط</strong>: يتابع نقاط فريقه وإجاباته، ولا يستطيع اللعب أو
          تسجيل أي إجابة. اختر فريقك من القائمة.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#475569]">اسم المدرب</span>
            <input className={inputClass} value={name} disabled={pending} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#475569]">الفريق</span>
            <select className={inputClass} value={teamId} disabled={pending} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">— اختر فريقك —</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#475569]">البريد الإلكتروني</span>
            <input
              className={inputClass}
              type="email"
              dir="ltr"
              value={email}
              disabled={pending}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#475569]">كلمة المرور</span>
            <input
              className={inputClass}
              type="password"
              dir="ltr"
              value={password}
              disabled={pending}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <p className="text-sm font-bold text-[#B91C1C]">{error}</p> : null}

          <button
            type="button"
            className="w-full rounded-xl bg-[#2388C4] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleSubmit()}
          >
            {pending ? "جارٍ الإنشاء..." : "إنشاء حساب المدرب"}
          </button>

          <p className="text-center text-xs font-semibold text-[#5A6B7D]">
            لديك حساب مدرب؟{" "}
            <Link href="/coach-login" className="font-black text-[#2388C4]">
              دخول المدرب
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
