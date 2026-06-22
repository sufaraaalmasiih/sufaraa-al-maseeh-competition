import type { FieldValue, Timestamp } from "firebase/firestore";

export type AppRole = "team" | "coach" | "viewer" | "facilitator" | "super_admin";

/** حساب مدرب منفصل — للعرض فقط، مرتبط بفريق، ولا يستطيع تسجيل أي إجابة. */
export interface CoachDocument {
  role: "coach";
  name: string;
  email: string;
  /** معرّف الفريق المرتبط (= uid حساب الفريق). */
  linkedTeamId: string;
  linkedTeamName: string;
  active: true;
  /**
   * نسخة نصّية من كلمة المرور لعرضها للمشرف العام في تبويب الإدارة (بطلب المالك).
   * ⚠️ تنازل أمني مقصود: كلمات مرور Firebase Auth مشفّرة ولا تُسترجَع، فنحفظ نسخة
   * هنا ليتمكّن المشرف من مشاركتها. قواعد Firestore تقصر قراءة المستند على المالك
   * والميسّر فقط.
   */
  accountPasswordPlain?: string;
  createdAt: Timestamp | FieldValue;
}

export type GameFlowStatus =
  | "waiting_players"
  | "competition_intro"
  | "stage1_intro"
  | "stage1_running"
  | "stage1_finished"
  | "stage2_intro"
  | "stage2_role_assignment"
  | "stage2_reading"
  | "stage2_player_turns"
  | "stage2_finished"
  | "stage3_intro"
  | "stage3_board"
  | "stage3_question_open"
  | "stage3_answer_closed"
  | "stage3_reveal"
  | "stage3_results_done"
  | "stage3_finished"
  | "stage4_intro"
  | "stage4_waiting_question"
  | "stage4_question_open"
  | "stage4_answers_closed"
  | "stage4_reveal"
  | "stage4_finished"
  | "final_results"
  | "podium";

export type GameFlowStage = "none" | string;

export interface GameFlow {
  status: GameFlowStatus;
  currentStage: GameFlowStage;
  currentQuestion: number;
  competitionFrozen?: boolean;
  competitionMode?: "official" | "training";
  trainingEndsAtMs?: number | null;
  stage4QuestionOpenedAtMs?: number | null;
  /** طابع زمني يُضبط عند «إنهاء المسابقة» لإخراج كل الفرق وتسجيل خروجها. */
  teamSignOutAt?: number | null;
}

export type TimerPurpose = "answering" | "reading" | "selection" | "reveal" | "none";

export type CompetitionTimerStage = "stage1" | "stage2" | "stage3" | "stage4" | "none";

export interface CompetitionTimer {
  active: boolean;
  stage: CompetitionTimerStage;
  purpose: TimerPurpose;
  durationSeconds: number;
  startedAtMs: number;
  endsAtMs: number;
  paused?: boolean;
  pausedRemainingMs?: number;
  controlledBy?: string;
  controlledByName?: string;
  updatedAt: Timestamp | FieldValue;
}

export interface TeamPlayer {
  name: string;
  type: "main" | "substitute";
}

export interface TeamDocument {
  teamName: string;
  governorate: string;
  email: string;
  role: "team";
  logoUrl?: string;
  players: TeamPlayer[];
  active: true;
  /**
   * نسخة نصّية من كلمة المرور لعرضها للمشرف العام في تبويب الإدارة (بطلب المالك).
   * ⚠️ تنازل أمني مقصود: كلمات مرور Firebase Auth مشفّرة ولا تُسترجَع، فنحفظ نسخة
   * هنا ليتمكّن المشرف من مشاركتها. قواعد Firestore تقصر قراءة المستند على المالك
   * والميسّر فقط.
   */
  accountPasswordPlain?: string;
  createdAt: Timestamp | FieldValue;
}

export interface InitialTeamStateInput {
  teamName: string;
  governorate: string;
  logoUrl?: string;
}

export interface TeamStateDocument {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string;
  ready: boolean;
  readiness: {
    competitionIntro: boolean;
    stage1Intro: boolean;
    stage2Intro: boolean;
    stage3Intro: boolean;
    stage4Intro: boolean;
    stage1: boolean;
    stage2: boolean;
    stage3: boolean;
    stage4: boolean;
  };
  connection: {
    online: boolean;
    lastSeenAt: Timestamp | FieldValue;
  };
  stageScores: {
    stage1: number;
    stage2: number;
    stage3: number;
    stage4: number;
  };
  totalScore: number;
  progress: {
    stage1QuestionIndex: number;
    stage2Field: string;
    stage2FieldIndex: number;
    stage2QuestionIndex: number;
    stage3SelectedQuestionId: string;
    stage3: {
      currentField: string;
      questionIndex: number;
    };
    stage4QuestionIndex: number;
    /** طوابع زمنية لآخر نشاط مُسجِّل للنقاط في كل مرحلة — لكسر التعادل بالأسرع. */
    stage1FinishedAtMs?: number;
    stage2FinishedAtMs?: number;
    stage3FinishedAtMs?: number;
    stage4FinishedAtMs?: number;
  };
  stage2Roles: {
    matching: string;
    arrangeVerse: string;
    completeVerse: string;
    trueFalseCorrect: string;
    locked?: boolean;
    lockedAt?: Timestamp | FieldValue;
  };
  stage4: {
    streak: number;
    nextCorrectPoints: number;
  };
  stageLocks?: {
    stage1: boolean;
    stage2: boolean;
    stage3: boolean;
    stage4: boolean;
  };
  facilitatorOverride?: {
    active: boolean;
    status: GameFlowStatus;
    currentStage: string;
    stage1QuestionIndex?: number;
    stage2QuestionIndex?: number;
    stage4QuestionIndex?: number;
    stage3QuestionId?: string;
    stage3ActiveQuestion?: Record<string, unknown> | null;
    stage4ActiveQuestion?: Record<string, unknown> | null;
  } | null;
  updatedAt: Timestamp | FieldValue;
}

export const roleRoutes: Record<AppRole, string> = {
  team: "/team",
  coach: "/coach",
  facilitator: "/facilitator",
  super_admin: "/facilitator",
  viewer: "/audience",
};

export const roleLoginRoutes: Record<AppRole, string> = {
  team: "/team-login",
  coach: "/coach-login",
  facilitator: "/facilitator-login",
  super_admin: "/admin-login",
  viewer: "/login",
};

export const gameFlowStatuses: GameFlowStatus[] = [
  "waiting_players",
  "competition_intro",
  "stage1_intro",
  "stage1_running",
  "stage1_finished",
  "stage2_intro",
  "stage2_role_assignment",
  "stage2_reading",
  "stage2_player_turns",
  "stage2_finished",
  "stage3_intro",
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
  "stage3_finished",
  "stage4_intro",
  "stage4_waiting_question",
  "stage4_question_open",
  "stage4_answers_closed",
  "stage4_reveal",
  "stage4_finished",
  "final_results",
  "podium",
];
