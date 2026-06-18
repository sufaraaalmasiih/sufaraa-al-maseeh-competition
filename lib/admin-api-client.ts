import { getClientFirebaseAuth } from "@/firebase/firebaseClient";

export async function getStaffAuthIdToken(): Promise<string> {
  const token = await getClientFirebaseAuth().currentUser?.getIdToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }
  return token;
}

export async function callAdminApi<T = void>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const idToken = await getStaffAuthIdToken();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
