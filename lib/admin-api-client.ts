import { getClientFirebaseAuth } from "@/firebase/firebaseClient";

export async function getStaffAuthIdToken(): Promise<string> {
  const token = await getClientFirebaseAuth().currentUser?.getIdToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }
  return token;
}

export type AdminApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export async function callAdminApiOptional<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
): Promise<AdminApiResult<T>> {
  try {
    const idToken = await getStaffAuthIdToken();
    const response = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

    if (!response.ok) {
      const serverMessage = payload.error?.trim();
      return {
        ok: false,
        status: response.status,
        error: serverMessage || `Request failed (${response.status}).`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Network error.",
    };
  }
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
    const serverMessage = payload.error?.trim();
    throw new Error(serverMessage || `Request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
