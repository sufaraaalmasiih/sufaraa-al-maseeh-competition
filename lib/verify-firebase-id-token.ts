const LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

export async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${LOOKUP_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { users?: Array<{ localId?: string }> };
  const uid = payload.users?.[0]?.localId;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}
