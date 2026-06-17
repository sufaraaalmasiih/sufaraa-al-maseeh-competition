/**
 * One-time Firestore bootstrap via Admin SDK.
 * Requires: service account JSON from Firebase Console.
 *
 * Usage:
 *   set FIREBASE_SERVICE_ACCOUNT=path\to\serviceAccount.json
 *   node scripts/seed-firestore-bootstrap.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "sufaraaalmasiih-53478";
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT;

function initAdmin() {
  if (SERVICE_ACCOUNT_PATH && existsSync(SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(readFileSync(resolve(SERVICE_ACCOUNT_PATH), "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const questionDisplaySettings = {
  stage1: { displayCount: 40, orderMode: "order" },
  stage2: { displayCount: 20, orderMode: "order" },
  stage3: { displayCount: 30, orderMode: "order" },
  stage4: { displayCount: 15, orderMode: "order" },
};

const defaultBankSizes = {
  stage1: 50,
  stage2: 20,
  stage3: 30,
  stage4: 15,
};

async function ensureDoc(ref, payload, label) {
  const snapshot = await ref.get();
  if (snapshot.exists) {
    console.log(`skip  ${label} (already exists)`);
    return false;
  }
  await ref.set(payload);
  console.log(`create ${label}`);
  return true;
}

async function main() {
  initAdmin();
  const db = getFirestore();
  const now = FieldValue.serverTimestamp();

  const created = [];

  if (
    await ensureDoc(
      db.doc("competitions/main/system/gameFlow"),
      {
        status: "waiting_players",
        currentStage: "none",
        activeSessionId: null,
        currentQuestion: 0,
        competitionFrozen: false,
        stage3ActiveQuestion: null,
        stage3OpenedQuestionIds: [],
        stage3UsedQuestionIds: [],
        stage3OwnerTeamId: null,
        stage3OwnerTeamName: null,
        stage3OwnerTurnIndex: 0,
        stage3TurnOrder: [],
        stage3SelectionStartedAt: 0,
        stage3LastAutoAdvanceKey: "",
        stage3RoundId: "",
        stage3LastSelectionTimeoutKey: "",
        stage3SelectionTimeoutNotice: null,
        stage4QuestionIndex: 0,
        stage4QuestionCount: 15,
        questionDisplaySettings,
        stage1ActiveQuestionIndices: [],
        stage2ActiveQuestionIndices: [],
        stage4ActiveQuestionIndices: [],
        stage2ReadingReference: "يوحنا 15: 1-17",
        stage2ReadingPassage: "",
        stage4ActiveQuestion: null,
        stage4FinishedQuestionIds: [],
        stage4RevealStartedAt: 0,
        updatedAt: now,
      },
      "gameFlow",
    )
  ) {
    created.push("gameFlow");
  }

  if (
    await ensureDoc(
      db.doc("competitions/main/system/timer"),
      {
        active: false,
        remainingSeconds: 0,
        stage: "none",
        purpose: "none",
        durationSeconds: 0,
        startedAtMs: 0,
        endsAtMs: 0,
        paused: false,
        pausedRemainingMs: 0,
        updatedAt: now,
      },
      "timer",
    )
  ) {
    created.push("timer");
  }

  if (
    await ensureDoc(
      db.doc("competitions/main/system/session"),
      { reauthEpoch: 0, updatedAt: now },
      "session",
    )
  ) {
    created.push("session");
  }

  if (
    await ensureDoc(
      db.doc("competitions/main/system/audienceDisplay"),
      { fullscreen: false, updatedAt: now },
      "audienceDisplay",
    )
  ) {
    created.push("audienceDisplay");
  }

  const metaRef = db.doc("competitions/main/questionBanks/meta");
  const metaSnap = await metaRef.get();
  if (!metaSnap.exists) {
    await metaRef.set({
      bankSizes: defaultBankSizes,
      stage2ReadingReference: "يوحنا 15: 1-17",
      stage2ReadingPassage: "",
      updatedAt: now,
    });
    console.log("create questionBanks/meta");
    created.push("meta");
  } else {
    console.log("skip  questionBanks/meta (already exists)");
  }

  if (created.length === 0) {
    console.log("\nDatabase already initialized.");
  } else {
    console.log(`\nDone. Created: ${created.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("\nBootstrap failed:", error.message ?? error);
  console.error(
    "\nTip: download service account JSON from Firebase Console → Project settings → Service accounts → Generate new private key",
  );
  console.error("Then run: set FIREBASE_SERVICE_ACCOUNT=C:\\path\\to\\key.json");
  process.exit(1);
});
