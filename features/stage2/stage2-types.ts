import type { FieldValue, Timestamp } from "firebase/firestore";

export type Stage2RoleKey =
  | "matching"
  | "arrangeVerse"
  | "completeVerse"
  | "trueFalseCorrect";

export interface Stage2Roles {
  matching: string;
  arrangeVerse: string;
  completeVerse: string;
  trueFalseCorrect: string;
  locked?: boolean;
  lockedAt?: Timestamp | FieldValue;
}

export const stage2RoleFields: { key: Stage2RoleKey; label: string }[] = [
  { key: "matching", label: "توصيل" },
  { key: "arrangeVerse", label: "رتّب الآية أو الآيات" },
  { key: "completeVerse", label: "أكمل الآيات" },
  { key: "trueFalseCorrect", label: "صح أو خطأ مع تصحيح" },
];

export const emptyStage2Roles: Stage2Roles = {
  matching: "",
  arrangeVerse: "",
  completeVerse: "",
  trueFalseCorrect: "",
};
