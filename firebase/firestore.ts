import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import type { InitialTeamStateInput, TeamStateDocument } from "@/types";

const firestore = getClientFirestore();

export const MAIN_COMPETITION_ID = "main";

export const gameFlowRef = doc(
  firestore,
  "competitions",
  "main",
  "system",
  "gameFlow",
);

export const timerRef = doc(
  firestore,
  "competitions",
  "main",
  "system",
  "timer",
);

export const competitionSessionRef = doc(
  firestore,
  "competitions",
  "main",
  "system",
  "session",
);

export const audienceDisplayRef = doc(
  firestore,
  "competitions",
  "main",
  "system",
  "audienceDisplay",
);

export const teamRef = (uid: string) => doc(getClientFirestore(), "teams", uid);
export const coachRef = (uid: string) => doc(getClientFirestore(), "coaches", uid);
export const userRef = (uid: string) => doc(getClientFirestore(), "users", uid);
export const answersCollectionRef = (competitionId: string) =>
  collection(getClientFirestore(), "competitions", competitionId, "answers");
export const answerRef = (competitionId: string, answerId: string) =>
  doc(getClientFirestore(), "competitions", competitionId, "answers", answerId);
export const teamStatesCollectionRef = (competitionId: string) =>
  collection(getClientFirestore(), "competitions", competitionId, "teamStates");
export const teamStateRef = (competitionId: string, uid: string) =>
  doc(getClientFirestore(), "competitions", competitionId, "teamStates", uid);

export function buildInitialTeamStateDocument(
  teamId: string,
  teamName: string,
  governorate: string,
): TeamStateDocument {
  return {
    teamId,
    teamName,
    governorate,
    ready: false,
    readiness: {
      competitionIntro: false,
      stage1Intro: false,
      stage2Intro: false,
      stage3Intro: false,
      stage4Intro: false,
      stage1: false,
      stage2: false,
      stage3: false,
      stage4: false,
    },
    connection: {
      online: true,
      lastSeenAt: serverTimestamp(),
    },
    stageScores: {
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
    },
    totalScore: 0,
    progress: {
      stage1QuestionIndex: 0,
      stage2Field: "",
      stage2FieldIndex: 0,
      stage2QuestionIndex: 0,
      stage3SelectedQuestionId: "",
      stage3: {
        currentField: "",
        questionIndex: 0,
      },
      stage4QuestionIndex: 0,
    },
    stage2Roles: {
      matching: "",
      arrangeVerse: "",
      completeVerse: "",
      trueFalseCorrect: "",
    },
    stage4: {
      streak: 0,
      nextCorrectPoints: 15,
    },
    stageLocks: {
      stage1: false,
      stage2: false,
      stage3: false,
      stage4: false,
    },
    facilitatorOverride: null,
    updatedAt: serverTimestamp(),
  };
}

export async function createInitialTeamState(
  competitionId: string,
  uid: string,
  teamData: InitialTeamStateInput,
): Promise<void> {
  await setDoc(
    teamStateRef(competitionId, uid),
    buildInitialTeamStateDocument(uid, teamData.teamName, teamData.governorate),
  );
}
