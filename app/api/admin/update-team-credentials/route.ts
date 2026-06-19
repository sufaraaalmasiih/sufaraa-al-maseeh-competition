import { NextResponse } from "next/server";
import { updateTeamAuthCredentialsOnServer } from "@/lib/admin-delete-team-server";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin-server";
import { verifySuperAdminRequest } from "@/lib/verify-super-admin-request";

export async function POST(request: Request) {
  const admin = await verifySuperAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "FIREBASE_SERVICE_ACCOUNT غير مضبوط على Vercel. أضفه في Environment variables ثم أعد النشر.",
      },
      { status: 503 },
    );
  }

  let body: { teamId?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as { teamId?: string; email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" && body.email.trim().length > 0 ? body.email.trim() : undefined;
  const password =
    typeof body.password === "string" && body.password.length >= 6 ? body.password : undefined;

  if (!email && !password) {
    return NextResponse.json({ error: "لا يوجد تغيير في بيانات الدخول." }, { status: 400 });
  }

  try {
    const result = await updateTeamAuthCredentialsOnServer(teamId, { email, password });
    return NextResponse.json(result);
  } catch (error) {
    const code = (error as { code?: string }).code;
    let message = "تعذّر تحديث بيانات الدخول.";
    if (code === "auth/email-already-exists") {
      message = "البريد مستخدم بحساب آخر.";
    } else if (code === "auth/invalid-email") {
      message = "البريد غير صحيح.";
    } else if (code === "auth/invalid-password") {
      message = "كلمة المرور ضعيفة (6 أحرف على الأقل).";
    } else if (code === "auth/user-not-found") {
      message = "حساب الفريق غير موجود في Authentication.";
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
