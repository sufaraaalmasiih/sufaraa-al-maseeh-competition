import { NextResponse } from "next/server";
import { deleteTeamCompletelyOnServer } from "@/lib/admin-delete-team-server";
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

  let body: { teamId?: string };
  try {
    body = (await request.json()) as { teamId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  try {
    const result = await deleteTeamCompletelyOnServer(teamId);
    return NextResponse.json({
      firestoreDeleted: true,
      deletedAnswers: result.deletedAnswers,
      authDeleted: result.authDeleted,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر حذف بيانات الفريق من Firestore." },
      { status: 500 },
    );
  }
}
