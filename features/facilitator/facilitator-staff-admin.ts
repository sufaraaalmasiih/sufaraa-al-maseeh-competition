import { collection, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { userRef } from "@/firebase/firestore";
import type { AppRole } from "@/types";

export interface StaffAccountRow {
  uid: string;
  fullName: string;
  email: string;
  role: Exclude<AppRole, "team">;
  active: boolean;
}

const STAFF_ROLES: Array<Exclude<AppRole, "team">> = ["facilitator", "super_admin"];

export async function listStaffAccounts(): Promise<StaffAccountRow[]> {
  const snapshot = await getDocs(
    query(collection(getClientFirestore(), "users"), where("role", "in", STAFF_ROLES)),
  );

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      const role = data.role;
      if (role !== "facilitator" && role !== "super_admin") {
        return null;
      }

      return {
        uid: docSnap.id,
        fullName: typeof data.fullName === "string" ? data.fullName : "—",
        email: typeof data.email === "string" ? data.email : "—",
        role,
        active: data.active !== false,
      } satisfies StaffAccountRow;
    })
    .filter((row): row is StaffAccountRow => row !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

export async function updateStaffAccountRole(
  uid: string,
  role: Exclude<AppRole, "team">,
): Promise<void> {
  await updateDoc(userRef(uid), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function setStaffAccountActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(userRef(uid), {
    active,
    updatedAt: serverTimestamp(),
  });
}
