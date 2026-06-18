import { NextResponse } from "next/server";
import { deleteTeamCompletelyOnServer } from "@/lib/admin-delete-team-server";
import { verifySuperAdminRequest } from "@/lib/verify-super-admin-request";

export async function POST(request: Request) {
  const admin = await verifySuperAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to delete team." }, { status: 500 });
  }
}
