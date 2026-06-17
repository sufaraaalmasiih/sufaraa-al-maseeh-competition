import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { serverTimestamp, setDoc } from "firebase/firestore";
import {
  getClientFirebaseAuth,
  getSecondaryFirebaseAuth,
  ensureAuthPersistence,
} from "@/firebase/firebaseClient";
import { createInitialTeamState, teamRef, userRef } from "@/firebase/firestore";
import type { RegisterTeamInput } from "@/features/auth/schemas";
import type { AppRole, TeamDocument } from "@/types";

const LOGO_UPLOAD_TIMEOUT_MS = 12000;
const MAIN_COMPETITION_ID = "main";

export class TeamStateCreateError extends Error {
  constructor() {
    super("Failed to create initial team state.");
    this.name = "TeamStateCreateError";
  }
}

export class InvalidLoginCredentialError extends Error {
  constructor() {
    super("Invalid login credential.");
    this.name = "InvalidLoginCredentialError";
  }
}

export interface RegisterTeamResult {
  logoUploadFailed: boolean;
}

export interface CreateAdminSideUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<AppRole, "team">;
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  console.info("[auth-login] start", { email });
  try {
    await ensureAuthPersistence();
    const auth = getClientFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await auth.authStateReady();
    console.info("[auth-login] success", { uid: credential.user.uid });
    return credential;
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "auth/invalid-credential"
    ) {
      console.warn("[auth-login] invalid credential", { email });
      throw new InvalidLoginCredentialError();
    }
    console.error("[auth-login] error", error);
    throw error;
  }
}

export async function createAdminSideUser(
  input: CreateAdminSideUserInput,
): Promise<void> {
  console.info("[admin-user-create] start", {
    email: input.email,
    role: input.role,
  });

  const credential = await createUserWithEmailAndPassword(
    getClientFirebaseAuth(),
    input.email,
    input.password,
  );
  const uid = credential.user.uid;
  console.info("[admin-user-create] auth user created", { uid });

  try {
    await writeStaffUserDocument(uid, input);
  } catch (error) {
    await signOut(getClientFirebaseAuth());
    throw error;
  }
}

/** إنشاء حساب ميسر من جلسة المشرف العام دون تسجيل خروجه */
export async function createFacilitatorBySuperAdmin(
  input: Pick<CreateAdminSideUserInput, "fullName" | "email" | "password">,
): Promise<void> {
  const primaryAuth = getClientFirebaseAuth();
  if (!primaryAuth.currentUser) {
    throw new Error("SUPER_ADMIN_REQUIRED");
  }

  const secondaryAuth = getSecondaryFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    input.email,
    input.password,
  );
  const uid = credential.user.uid;

  try {
    await writeStaffUserDocument(uid, {
      ...input,
      role: "facilitator",
    });
  } finally {
    await signOut(secondaryAuth);
  }
}

async function writeStaffUserDocument(
  uid: string,
  input: CreateAdminSideUserInput,
): Promise<void> {
  console.info("[admin-user-create] write users/{uid} start", {
    path: `users/${uid}`,
  });
  await setDoc(userRef(uid), {
    fullName: input.fullName,
    email: input.email,
    role: input.role,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.info("[admin-user-create] write users/{uid} success", {
    path: `users/${uid}`,
  });
}

export async function logout(): Promise<void> {
  await signOut(getClientFirebaseAuth());
}

export { getUserRole } from "@/firebase/get-user-role";

export async function registerTeam(input: RegisterTeamInput): Promise<RegisterTeamResult> {
  console.info("[team-register] start", {
    email: input.email,
    teamName: input.teamName,
    governorate: input.governorate,
    hasLogo: Boolean(input.logo?.[0]),
  });
  const credential = await createUserWithEmailAndPassword(
    getClientFirebaseAuth(),
    input.email,
    input.password,
  );
  const uid = credential.user.uid;
  console.info("[team-register] auth user created", { uid });

  console.info("[team-register] optional logo upload start", {
    uid,
    hasLogo: Boolean(input.logo?.[0]),
  });
  const { logoUrl, logoUploadFailed } = input.logo?.[0]
    ? await tryUploadTeamLogo(uid, input.logo[0])
    : { logoUrl: undefined, logoUploadFailed: false };
  console.info("[team-register] optional logo upload complete", {
    uid,
    logoUploadFailed,
    hasLogoUrl: Boolean(logoUrl),
  });

  const teamDocument: TeamDocument = {
    teamName: input.teamName,
    governorate: input.governorate,
    email: input.email,
    role: "team",
    ...(logoUrl ? { logoUrl } : {}),
    players: [
      { name: input.player1, type: "main" },
      { name: input.player2, type: "main" },
      { name: input.player3, type: "main" },
      { name: input.player4, type: "main" },
      { name: input.player5, type: "substitute" },
    ],
    active: true,
    createdAt: serverTimestamp(),
  };

  console.info("[team-register] write teams/{uid} start", {
    path: `teams/${uid}`,
  });
  await setDoc(teamRef(uid), teamDocument);
  console.info("[team-register] write teams/{uid} success", {
    path: `teams/${uid}`,
  });

  console.info("[team-register] write competitions/main/teamStates/{uid} start", {
    path: `competitions/${MAIN_COMPETITION_ID}/teamStates/${uid}`,
  });
  try {
    await createInitialTeamState(MAIN_COMPETITION_ID, uid, {
      teamName: input.teamName,
      governorate: input.governorate,
    });
    console.info("[team-register] write competitions/main/teamStates/{uid} success", {
      path: `competitions/${MAIN_COMPETITION_ID}/teamStates/${uid}`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("team-state-create-error", error);
    }
    throw new TeamStateCreateError();
  }

  return { logoUploadFailed };
}

async function uploadTeamLogo(uid: string, file: File): Promise<string> {
  console.info("[team-register] upload logo cloudinary start", { uid });
  const auth = getClientFirebaseAuth();
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Missing auth token for logo upload.");
  }

  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch("/api/team-logo/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Logo upload failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { logoUrl?: string };
  if (!payload.logoUrl) {
    throw new Error("Logo upload returned no URL.");
  }

  console.info("[team-register] upload logo cloudinary success", { uid });
  return payload.logoUrl;
}

async function tryUploadTeamLogo(
  uid: string,
  file: File,
): Promise<{ logoUrl?: string; logoUploadFailed: boolean }> {
  try {
    const logoUrl = await withTimeout(
      uploadTeamLogo(uid, file),
      LOGO_UPLOAD_TIMEOUT_MS,
    );
    return { logoUrl, logoUploadFailed: false };
  } catch (error) {
    console.warn("[team-register] optional logo upload failed; continuing", error);
    return { logoUrl: undefined, logoUploadFailed: true };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
