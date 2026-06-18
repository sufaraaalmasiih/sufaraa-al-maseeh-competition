import { NextResponse } from "next/server";
import { deleteStaffAccountOnServer } from "@/lib/admin-delete-team-server";
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
          "FIREBASE_SERVICE_ACCOUNT غير مضبوط على Netlify. أضفه في Environment variables.",
      },
      { status: 503 },
    );
  }

  let body: { uid?: string };
  try {
    body = (await request.json()) as { uid?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const uid = typeof body.uid === "string" ? body.uid.trim() : "";
  if (!uid) {
    return NextResponse.json({ error: "Missing uid." }, { status: 400 });
  }

  if (uid === admin.uid) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  try {
    await deleteStaffAccountOnServer(uid);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete staff account." }, { status: 500 });
  }
}
