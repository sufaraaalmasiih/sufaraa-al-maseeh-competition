import { NextResponse } from "next/server";
import { deleteCoachCompletelyOnServer } from "@/lib/admin-delete-team-server";
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

  let body: { coachId?: string };
  try {
    body = (await request.json()) as { coachId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const coachId = typeof body.coachId === "string" ? body.coachId.trim() : "";
  if (!coachId) {
    return NextResponse.json({ error: "Missing coachId." }, { status: 400 });
  }

  try {
    const result = await deleteCoachCompletelyOnServer(coachId);
    return NextResponse.json({
      firestoreDeleted: true,
      authDeleted: result.authDeleted,
      authError: result.authError,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر حذف حساب المدرب من Firestore." },
      { status: 500 },
    );
  }
}
