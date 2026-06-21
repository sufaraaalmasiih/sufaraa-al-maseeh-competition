"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore, firebaseAuth } from "@/firebase/firebaseClient";
import { competitionSessionRef, gameFlowRef, MAIN_COMPETITION_ID } from "@/firebase/firestore";
import {
  fetchCompetitionMode,
  isTrainingMode,
} from "@/features/facilitator/competition-mode";
import { deleteAllTeamStates, resetCompetition } from "@/features/gameflow/competition-reset";
import {
  deleteTrainingObjections,
  parseArchivedObjections,
  type CompetitionObjection,
} from "@/features/facilitator/objections";
import { writeTeamArchivesForSession } from "@/features/facilitator/use-team-archive";
import type { FinalResultTeam } from "@/features/facilitator/use-final-results";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";

export interface ArchiveTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  total: number;
  rank: number;
}

export type SessionStatus = "active" | "completed";

export interface CompetitionSession {
  id: string;
  title: string;
  version: string;
  hostGovernorate: string;
  status: SessionStatus;
  startedAtMs: number;
  startedByUid: string | null;
  startedByName: string | null;
  resultsSavedAtMs: number | null;
  resultsSavedMode: "manual" | "auto" | null;
  teams: ArchiveTeam[];
  objections: CompetitionObjection[];
}

export interface SessionEditLogEntry {
  id: string;
  action: string;
  reason: string;
  facilitatorUid: string | null;
  facilitatorName: string;
  createdAtMs: number;
  beforeValue?: unknown;
  afterValue?: unknown;
  details?: Record<string, unknown>;
  teamId?: string | null;
  teamName?: string | null;
}

/** Firestore doc limit is 1 MiB; cap entries to avoid oversized history documents. */
export const MAX_EDIT_LOG_ENTRIES = 150;

export function buildSessionTitle(version: string, hostGovernorate: string): string {
  const versionLabel = version.trim() || "نسخة بدون عنوان";
  const governorateLabel = hostGovernorate.trim() || "محافظة غير محددة";
  return `مسابقة سفراء المسيح ${versionLabel} في محافظة ${governorateLabel}`;
}

export function getFacilitatorActorName(): string {
  const user = firebaseAuth.currentUser;
  return user?.displayName?.trim() || user?.email?.split("@")[0] || "ميسر";
}

function historyCollection() {
  return collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "history");
}

function historyDoc(id: string) {
  return doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "history", id);
}

function createEditLogEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    try {
      return (value as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

export function recomputeArchiveTeams(teams: ArchiveTeam[]): ArchiveTeam[] {
  const withTotals = teams.map((team) => ({
    ...team,
    total: team.stage1 + team.stage2 + team.stage3 + team.stage4,
  }));
  withTotals.sort((first, second) => {
    if (second.total !== first.total) {
      return second.total - first.total;
    }
    return first.teamName.localeCompare(second.teamName, "ar");
  });
  return withTotals.map((team, index) => ({ ...team, rank: index + 1 }));
}

function parseTeams(raw: unknown): ArchiveTeam[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => {
    const team = (entry ?? {}) as Record<string, unknown>;
    return {
      teamId: typeof team.teamId === "string" ? team.teamId : "",
      teamName: typeof team.teamName === "string" ? team.teamName : "فريق بدون اسم",
      governorate: typeof team.governorate === "string" ? team.governorate : "غير محددة",
      stage1: num(team.stage1),
      stage2: num(team.stage2),
      stage3: num(team.stage3),
      stage4: num(team.stage4),
      total: num(team.total),
      rank: num(team.rank),
    };
  });
}

function parseSession(id: string, data: Record<string, unknown>): CompetitionSession {
  const version = typeof data.version === "string" ? data.version : "";
  const hostGovernorate =
    typeof data.hostGovernorate === "string" ? data.hostGovernorate : "";
  const title =
    typeof data.title === "string"
      ? data.title
      : buildSessionTitle(version, hostGovernorate);

  return {
    id,
    title,
    version,
    hostGovernorate,
    status: data.status === "active" ? "active" : "completed",
    startedAtMs: toMs(data.startedAt) || toMs(data.archivedAt),
    startedByUid: typeof data.startedByUid === "string" ? data.startedByUid : null,
    startedByName: typeof data.startedByName === "string" ? data.startedByName : null,
    resultsSavedAtMs: toMs(data.resultsSavedAt) || null,
    resultsSavedMode:
      data.resultsSavedMode === "manual" || data.resultsSavedMode === "auto"
        ? data.resultsSavedMode
        : null,
    teams: parseTeams(data.teams),
    objections: parseArchivedObjections(data.objections),
  };
}

function parseEditLog(id: string, data: Record<string, unknown>): SessionEditLogEntry {
  const createdAtMs =
    typeof data.createdAtMs === "number" && Number.isFinite(data.createdAtMs)
      ? data.createdAtMs
      : toMs(data.createdAt);

  return {
    id,
    action: typeof data.action === "string" ? data.action : "unknown",
    reason: typeof data.reason === "string" ? data.reason : "",
    facilitatorUid: typeof data.facilitatorUid === "string" ? data.facilitatorUid : null,
    facilitatorName:
      typeof data.facilitatorName === "string" ? data.facilitatorName : "ميسر",
    createdAtMs,
    beforeValue: data.beforeValue,
    afterValue: data.afterValue,
    details:
      data.details && typeof data.details === "object"
        ? (data.details as Record<string, unknown>)
        : undefined,
    teamId: typeof data.teamId === "string" ? data.teamId : null,
    teamName: typeof data.teamName === "string" ? data.teamName : null,
  };
}

function parseEditLogEntries(raw: unknown): SessionEditLogEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const data = entry as Record<string, unknown>;
      const id =
        typeof data.id === "string" && data.id.length > 0
          ? data.id
          : `legacy-${index}`;
      return parseEditLog(id, data);
    })
    .filter((entry): entry is SessionEditLogEntry => entry !== null)
    .sort((first, second) => second.createdAtMs - first.createdAtMs);
}

export async function readActiveSessionId(): Promise<string | null> {
  const snapshot = await getDoc(gameFlowRef);
  const value = snapshot.data()?.activeSessionId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeEditLogEntryForWrite(entry: Record<string, unknown>): Record<string, unknown> {
  const createdAtMs =
    typeof entry.createdAtMs === "number" && Number.isFinite(entry.createdAtMs)
      ? entry.createdAtMs
      : toMs(entry.createdAt);

  const normalized: Record<string, unknown> = { ...entry };
  delete normalized.createdAt;
  if (createdAtMs > 0) {
    normalized.createdAtMs = createdAtMs;
  }
  return normalized;
}

export async function appendSessionEditLog(
  sessionId: string,
  entry: Omit<SessionEditLogEntry, "id" | "createdAtMs" | "facilitatorUid" | "facilitatorName"> & {
    facilitatorUid?: string | null;
    facilitatorName?: string;
  },
): Promise<void> {
  const createdAtMs = Date.now();
  const storedEntry = normalizeEditLogEntryForWrite({
    id: createEditLogEntryId(),
    action: entry.action,
    reason: entry.reason,
    facilitatorUid: entry.facilitatorUid ?? firebaseAuth.currentUser?.uid ?? null,
    facilitatorName: entry.facilitatorName ?? getFacilitatorActorName(),
    beforeValue: entry.beforeValue ?? null,
    afterValue: entry.afterValue ?? null,
    details: entry.details ?? null,
    teamId: entry.teamId ?? null,
    teamName: entry.teamName ?? null,
    createdAtMs,
  });

  const ref = historyDoc(sessionId);
  await runTransaction(getClientFirestore(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error("جلسة السجل غير موجودة.");
    }
    const rawExisting = Array.isArray(snapshot.data()?.editLogEntries)
      ? (snapshot.data()?.editLogEntries as Record<string, unknown>[])
      : [];
    const nextEntries = [
      storedEntry,
      ...rawExisting.map(normalizeEditLogEntryForWrite),
    ].slice(0, MAX_EDIT_LOG_ENTRIES);
    transaction.update(ref, {
      editLogEntries: nextEntries,
      lastModifiedAtMs: createdAtMs,
    });
  });
}

export async function appendActiveSessionEditLog(
  entry: Omit<SessionEditLogEntry, "id" | "createdAtMs" | "facilitatorUid" | "facilitatorName"> & {
    facilitatorUid?: string | null;
    facilitatorName?: string;
  },
): Promise<void> {
  const sessionId = await readActiveSessionId();
  if (!sessionId) {
    return;
  }
  try {
    await appendSessionEditLog(sessionId, entry);
  } catch {
    // Controls mutations must not fail if the edit log write fails.
  }
}

function defaultSessionVersion(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export async function createCompetitionSession(input: {
  version?: string;
  hostGovernorate?: string;
} = {}): Promise<string> {
  // النسخة/المحافظة لم تعد تُطلب عند البدء — نُولّد عنواناً افتراضياً واضحاً للأرشيف.
  const version = (input.version ?? "").trim() || defaultSessionVersion();
  const hostGovernorate = (input.hostGovernorate ?? "").trim();

  const facilitatorName = getFacilitatorActorName();
  const title = hostGovernorate
    ? buildSessionTitle(version, hostGovernorate)
    : `مسابقة سفراء المسيح — ${version}`;

  const created = await addDoc(historyCollection(), {
    title,
    version,
    hostGovernorate,
    status: "active",
    teams: [],
    editLogEntries: [],
    startedAt: serverTimestamp(),
    startedByUid: firebaseAuth.currentUser?.uid ?? null,
    startedByName: facilitatorName,
    resultsSavedAt: null,
    resultsSavedMode: null,
    lastModifiedAtMs: Date.now(),
    archivedAt: serverTimestamp(),
  });

  await updateDoc(gameFlowRef, { activeSessionId: created.id });

  await appendSessionEditLog(created.id, {
    action: "session_started",
    reason: "بدء مسابقة جديدة",
    details: { version, hostGovernorate, title },
  });

  return created.id;
}

export async function saveSessionResults(
  sessionId: string,
  teams: FinalResultTeam[] | ArchiveTeam[],
  mode: "manual" | "auto",
  reason = mode === "auto" ? "حفظ تلقائي عند انتهاء المسابقة" : "حفظ يدوي من تبويب النتائج",
): Promise<void> {
  const snapshot = await getDoc(historyDoc(sessionId));
  const beforeTeams = snapshot.exists()
    ? parseTeams((snapshot.data() as Record<string, unknown>).teams)
    : [];

  const snapshotTeams: ArchiveTeam[] = teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    governorate: team.governorate,
    stage1: team.stage1,
    stage2: team.stage2,
    stage3: team.stage3,
    stage4: team.stage4,
    total: team.total,
    rank: team.rank,
  }));

  await updateDoc(historyDoc(sessionId), {
    teams: snapshotTeams,
    resultsSavedAt: serverTimestamp(),
    resultsSavedMode: mode,
    status: "completed",
    archivedAt: serverTimestamp(),
  });

  // نسخة أرشيف لكل فريق في مجموعة خاصة (يقرؤها الفريق نفسه فقط — خصوصية).
  const sessionData = snapshot.data() as Record<string, unknown> | undefined;
  await writeTeamArchivesForSession(
    {
      sessionId,
      title: typeof sessionData?.title === "string" ? sessionData.title : "مسابقة",
      version: typeof sessionData?.version === "string" ? sessionData.version : "",
      hostGovernorate:
        typeof sessionData?.hostGovernorate === "string" ? sessionData.hostGovernorate : "",
      dateMs: Date.now(),
    },
    snapshotTeams,
  );

  await appendSessionEditLog(sessionId, {
    action: "results_saved",
    reason,
    beforeValue: beforeTeams,
    afterValue: snapshotTeams,
    details: { mode, teamCount: snapshotTeams.length },
  });
}

export async function saveActiveSessionResults(
  teams: FinalResultTeam[],
  mode: "manual" | "auto",
  reason?: string,
): Promise<string | null> {
  const competitionMode = await fetchCompetitionMode();
  if (isTrainingMode(competitionMode)) {
    return null;
  }

  const sessionId = await readActiveSessionId();
  if (!sessionId) {
    return null;
  }
  await saveSessionResults(sessionId, teams, mode, reason);
  return sessionId;
}

export async function completeActiveSession(): Promise<void> {
  const sessionId = await readActiveSessionId();
  if (!sessionId) {
    return;
  }
  await updateDoc(historyDoc(sessionId), { status: "completed" });
}

export async function clearActiveSessionLink(): Promise<void> {
  await updateDoc(gameFlowRef, { activeSessionId: null });
}

/**
 * إنهاء المسابقة نهائياً: يحفظ السجل النهائي (في الوضع الرسمي)، يفصل السجل النشط،
 * ويسجّل خروج كل الفرق عبر `teamSignOutAt`. تبقى بيانات الأرشيف محفوظة.
 */
export async function endCompetition(teams: FinalResultTeam[]): Promise<void> {
  const competitionMode = await fetchCompetitionMode();

  if (isTrainingMode(competitionMode)) {
    // تدريب: لا أرشيف — تُحذف اعتراضات التدريب أيضاً.
    await deleteTrainingObjections();
  } else {
    // رسمية: تُحفظ النتائج في السجل (الاعتراضات تبقى مرتبطة بالسجل).
    const sessionId = await readActiveSessionId();
    if (sessionId) {
      await saveSessionResults(
        sessionId,
        teams,
        "manual",
        "إنهاء المسابقة وحفظ السجل النهائي",
      );
    }
  }

  // بداية نظيفة كاملة كأن مسابقة جديدة: حذف الإجابات، تصفير الفرق،
  // إرجاع gameFlow إلى waiting_players، وفصل السجل النشط.
  await resetCompetition();

  // مطابقة «بدء مسابقة جديدة»: حذف حالات الفرق نهائياً حتى لا يظهر أيّ فريق في
  // السير/التحكم، فيجب على كل فريق إعادة التسجيل/الدخول قبل المشاركة من جديد.
  // (الأرشيف والنتائج النهائية حُفظت أعلاه من `teams`، فالحذف آمن.)
  await deleteAllTeamStates();

  // تسجيل خروج كل الفرق (آليتان: teamSignOutAt + reauthEpoch) — يصبحون غير مشاركين
  // حتى يعودوا ويسجّلوا الدخول من جديد.
  await setDoc(
    competitionSessionRef,
    { reauthEpoch: Date.now(), updatedAt: serverTimestamp() },
    { merge: true },
  );
  await updateDoc(gameFlowRef, {
    teamSignOutAt: Date.now(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSessionMetadata(
  sessionId: string,
  input: { version?: string; hostGovernorate?: string; title?: string },
  reason: string,
): Promise<void> {
  const snapshot = await getDoc(historyDoc(sessionId));
  if (!snapshot.exists()) {
    throw new Error("السجل غير موجود.");
  }
  const current = parseSession(sessionId, snapshot.data() as Record<string, unknown>);
  const version = input.version?.trim() ?? current.version;
  const hostGovernorate = input.hostGovernorate?.trim() ?? current.hostGovernorate;
  const title = input.title?.trim() || buildSessionTitle(version, hostGovernorate);

  await updateDoc(historyDoc(sessionId), { version, hostGovernorate, title });

  await appendSessionEditLog(sessionId, {
    action: "session_metadata_updated",
    reason,
    beforeValue: {
      title: current.title,
      version: current.version,
      hostGovernorate: current.hostGovernorate,
    },
    afterValue: { title, version, hostGovernorate },
  });
}

export async function updateSessionTeams(
  sessionId: string,
  teams: ArchiveTeam[],
  reason: string,
): Promise<void> {
  const snapshot = await getDoc(historyDoc(sessionId));
  const beforeTeams = snapshot.exists()
    ? parseTeams((snapshot.data() as Record<string, unknown>).teams)
    : [];

  const nextTeams = recomputeArchiveTeams(teams);
  await updateDoc(historyDoc(sessionId), { teams: nextTeams });

  await appendSessionEditLog(sessionId, {
    action: "session_results_updated",
    reason,
    beforeValue: beforeTeams,
    afterValue: nextTeams,
  });
}

export async function deleteSession(sessionId: string, reason: string): Promise<void> {
  void reason;

  const activeSessionId = await readActiveSessionId();
  if (activeSessionId === sessionId) {
    await clearActiveSessionLink();
  }

  await deleteDoc(historyDoc(sessionId));

  // احذف نسخ أرشيف الفرق لهذه الجلسة حتى لا تبقى «مشاركة يتيمة» في أرشيف الفريق
  // بعد اختفاء السجل من تبويب «السجل».
  try {
    const archives = await getDocs(
      query(
        collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "teamArchives"),
        where("sessionId", "==", sessionId),
      ),
    );
    await Promise.all(archives.docs.map((document) => deleteDoc(document.ref)));
  } catch {
    // غير حرج — لا تُفشل حذف السجل إذا تعذّر تنظيف نسخ الأرشيف.
  }
}

export function useCompetitionHistory() {
  const [archives, setArchives] = useState<CompetitionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(historyCollection(), orderBy("archivedAt", "desc")),
      (snapshot) => {
        setArchives(
          snapshot.docs.map((item) => parseSession(item.id, item.data())),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل سجل المسابقات.");
        setLoading(false);
      },
    );
  }, []);

  return { archives, loading, error };
}

export function useSessionEditLog(sessionId: string | null) {
  const [entries, setEntries] = useState<SessionEditLogEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(
      historyDoc(sessionId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setEntries([]);
          setError(null);
          setLoading(false);
          return;
        }

        setEntries(parseEditLogEntries(snapshot.data()?.editLogEntries));
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل سجل التعديلات.");
        setLoading(false);
      },
    );
  }, [sessionId]);

  return { entries, loading, error };
}

export function useActiveSessionEditLog() {
  const sessionId = useActiveSessionId();
  return useSessionEditLog(sessionId);
}

export function useActiveSessionId() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeFirestoreDoc(
      gameFlowRef,
      (snapshot) => {
        const value = snapshot.data()?.activeSessionId;
        setSessionId(typeof value === "string" && value.length > 0 ? value : null);
      },
      () => {
        setSessionId(null);
      },
    );
  }, []);

  return sessionId;
}
