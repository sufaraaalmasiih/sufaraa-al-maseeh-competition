"use client";

import { useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { CompetitionIntroContent } from "@/features/gameflow/components/competition-intro-content";
import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { Stage1QuestionCard } from "@/features/stage1/components/stage1-question-card";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import { Stage2MatchingQuestionCard } from "@/features/stage2/components/stage2-matching-question-card";
import { Stage2ReadingPanel } from "@/features/stage2/components/stage2-reading-panel";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import { Stage3Board } from "@/features/stage3/components/stage3-board";
import { Stage3BoardViewportFit } from "@/features/stage3/components/stage3-board-viewport-fit";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import competitionLogo from "@/features/team/assets/competition-logo-white-transparent.png";
import { AuditGameplayHeader } from "@/app/dev/team-responsive-audit/audit-gameplay-header";

const MOCK_STAGE1_QUESTION: Stage1MockQuestion = {
  id: "audit-s1",
  type: "multiple_choice",
  prompt: "من هو الذي قال: «أنا هو الطريق والحق والحياة»؟",
  reference: "يوحنا 14:6",
  options: ["بطرس", "يوحنا", "يسوع", "بولس"],
  correctAnswer: "يسوع",
};

const MOCK_MATCHING_QUESTION: Stage2MatchingQuestion = {
  id: "audit-s2-matching",
  prompt: "طابق كل شخصية بالحدث المناسب",
  reference: "أعمال 9",
  pairs: [
    { left: "شاول", correctRight: "الاضطهاد" },
    { left: "حننيا", correctRight: "الشفاء" },
    { left: "برنابا", correctRight: "الرفيق" },
    { left: "يسوع", correctRight: "الظهور" },
    { left: "تلميذ", correctRight: "دمشق" },
  ],
  rightOptions: ["الاضطهاد", "الشفاء", "الرفيق", "الظهور", "دمشق", "أنطاكية"],
};

const MOCK_STAGE4_QUESTION: Stage4QuestionMetadata = {
  id: "audit-s4",
  type: "multiple_choice",
  prompt: "من هو الذي سجن مع بولس في فيلبي؟",
  reference: "أعمال 16:25",
  options: ["سيلا", "تيموثاوس", "لوقا", "برنابا"],
  correctAnswer: "سيلا",
  order: 3,
};

export const AUDIT_SCREEN_IDS = [
  "waiting",
  "competition-intro",
  "stage1-intro",
  "stage1-running",
  "stage2-reading",
  "stage2-matching",
  "stage3-board",
  "stage4-question",
] as const;

export type AuditScreenId = (typeof AUDIT_SCREEN_IDS)[number];

export function isAuditScreenId(value: string | null | undefined): value is AuditScreenId {
  return AUDIT_SCREEN_IDS.includes(value as AuditScreenId);
}

interface AuditScreenProps {
  screen: AuditScreenId;
}

export function AuditScreen({ screen }: AuditScreenProps) {
  switch (screen) {
    case "waiting":
      return <AuditWaitingScreen />;
    case "competition-intro":
      return <AuditCompetitionIntroScreen />;
    case "stage1-intro":
      return <AuditStageIntroScreen stage="stage1" />;
    case "stage1-running":
      return <AuditStage1RunningScreen />;
    case "stage2-reading":
      return <AuditStage2ReadingScreen />;
    case "stage2-matching":
      return <AuditStage2MatchingScreen />;
    case "stage3-board":
      return <AuditStage3BoardScreen />;
    case "stage4-question":
      return <AuditStage4QuestionScreen />;
    default:
      return null;
  }
}

function AuditWaitingScreen() {
  return (
    <div className="team-waiting-screen">
      <div className="team-waiting-screen__logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="شعار المسابقة" className="team-waiting-screen__logo" src={competitionLogo.src} />
      </div>
      <h1 className="team-waiting-screen__title">سفراء المسيح</h1>
      <p className="team-waiting-screen__slogan">نحيا بالكلمة... ونشهد للحق</p>
      <p className="team-waiting-screen__team-name">فريق النور</p>
      <div className="team-waiting-screen__message">
        <p className="team-waiting-screen__message-title">بانتظار بدء المسابقة</p>
        <p className="team-waiting-screen__message-body">سيبدأ الميسر المسابقة قريباً</p>
      </div>
      <div className="game-ready-btn-wrap mt-4">
        <GameReadyButton>جاهزون</GameReadyButton>
      </div>
    </div>
  );
}

function AuditCompetitionIntroScreen() {
  return (
    <div className="competition-intro-screen space-y-6">
      <CompetitionIntroContent showReadyHint />
      <div className="game-ready-btn-wrap">
        <GameReadyButton>تم الاطلاع</GameReadyButton>
      </div>
    </div>
  );
}

function AuditStageIntroScreen({ stage }: { stage: "stage1" | "stage2" | "stage3" | "stage4" }) {
  return (
    <StageIntroContent
      stage={stage}
      showTeamMeta
      footer={
        <>
          <div className="stage1-intro-screen__action">
            <GameReadyButton>جاهز</GameReadyButton>
          </div>
          <p className="stage1-intro-screen__hint">بانتظار بدء الميسر للمرحلة</p>
        </>
      }
    />
  );
}

function AuditStage1RunningScreen() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  return (
    <ArenaLayout
      questionTypeLabel="اختر من متعدد"
      questionNumber={7}
      totalQuestions={50}
      question={
        <QuestionPrompt reference={MOCK_STAGE1_QUESTION.reference} size="arena">
          {MOCK_STAGE1_QUESTION.prompt}
        </QuestionPrompt>
      }
      board={
        <Stage1QuestionCard
          question={MOCK_STAGE1_QUESTION}
          questionNumber={7}
          totalQuestions={50}
          arrangeShuffleSeed="audit"
          selectedAnswer={selectedAnswer}
          answerText=""
          confirmed={false}
          saving={false}
          saveError={null}
          interactionOnly
          onSelectAnswer={setSelectedAnswer}
          onAnswerTextChange={() => undefined}
          onConfirm={() => undefined}
        />
      }
    />
  );
}

function AuditStage2ReadingScreen() {
  return (
    <Stage2ReadingPanel
      reference="أعمال 9: 1-19"
      passage="«وشاول بعدما أتمّ استهجاناته كان يضطهد الكنيسة...»"
      hasReadingTimer
    />
  );
}

function AuditStage2MatchingScreen() {
  return (
    <div className="gameplay-scene gameplay-scene--centered">
      <div className="gameplay-flow">
        <div className="gameplay-board-card">
          <Stage2MatchingQuestionCard
            question={MOCK_MATCHING_QUESTION}
            confirmed={false}
            saving={false}
            saveError={null}
            disabled={false}
            onConfirm={() => undefined}
          />
        </div>
      </div>
    </div>
  );
}

function AuditStage3BoardScreen() {
  return (
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--board">
      <div className="gameplay-flow">
        <Stage3BoardViewportFit>
          <Stage3Board
            variant="team"
            featured
            embedded
            hideHeader
            canChoose
            ownerTeamName="فريق النور"
          />
        </Stage3BoardViewportFit>
      </div>
    </div>
  );
}

function AuditStage4QuestionScreen() {
  return (
    <div className="stage4-scene stage4-scene--question">
      <div className="gameplay-flow">
        <div className="gameplay-board-card stage4-team-card">
          <Stage4QuestionDisplay
            question={MOCK_STAGE4_QUESTION}
            questionIndex={2}
            questionCount={15}
            variant="team"
            embedded
          />
          <div className="gameplay-board-body">
            <div className="gameplay-mc-choice-zone">
              <div className="quiz-choice-grid">
                {MOCK_STAGE4_QUESTION.options?.map((option) => (
                  <button key={option} type="button" className="quiz-choice-card">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditGameplayHeaderForScreen(screen: AuditScreenId) {
  if (screen === "waiting" || screen === "competition-intro") {
    return null;
  }

  if (screen === "stage1-running") {
    return <AuditGameplayHeader stageLabel="اجمعوا الكنوز" hasTimer remainingSeconds={312} />;
  }

  if (screen === "stage2-reading") {
    return <AuditGameplayHeader stageLabel="فتشوا الكتب" hasTimer remainingSeconds={142} />;
  }

  if (screen === "stage2-matching") {
    return <AuditGameplayHeader stageLabel="فتشوا الكتب" />;
  }

  if (screen === "stage3-board") {
    return <AuditGameplayHeader stageLabel="على المحك" />;
  }

  if (screen === "stage4-question") {
    return <AuditGameplayHeader stageLabel="اثبتوا بالحق" hasTimer remainingSeconds={18} />;
  }

  return <AuditGameplayHeader stageLabel="اجمعوا الكنوز" />;
}

export function getAuditShellConfig(screen: AuditScreenId): {
  scrollable: boolean;
  contentClassName: string;
  fillViewport: boolean;
  centerBody: boolean;
} {
  switch (screen) {
    case "waiting":
      return {
        scrollable: false,
        contentClassName: "team-waiting-screen__content",
        fillViewport: false,
        centerBody: true,
      };
    case "competition-intro":
      return {
        scrollable: true,
        contentClassName: "competition-intro-screen__wrap",
        fillViewport: false,
        centerBody: true,
      };
    case "stage1-intro":
      return {
        scrollable: true,
        contentClassName: "stage1-intro-screen__wrap",
        fillViewport: false,
        centerBody: true,
      };
    case "stage1-running":
      return {
        scrollable: false,
        contentClassName: "content-shell-arena",
        fillViewport: true,
        centerBody: false,
      };
    case "stage2-reading":
      return {
        scrollable: true,
        contentClassName: "stage2-reading-screen__wrap",
        fillViewport: false,
        centerBody: true,
      };
    case "stage2-matching":
      return {
        scrollable: false,
        contentClassName: "content-shell-arena content-shell-arena--stage2",
        fillViewport: true,
        centerBody: false,
      };
    case "stage3-board":
      return {
        scrollable: false,
        contentClassName:
          "content-shell-arena content-shell-arena--stage3 content-shell-arena--stage3-board",
        fillViewport: true,
        centerBody: false,
      };
    case "stage4-question":
      return {
        scrollable: false,
        contentClassName: "content-shell-arena content-shell-arena--stage4",
        fillViewport: true,
        centerBody: false,
      };
    default:
      return {
        scrollable: true,
        contentClassName: "competition-flow-shell__wrap",
        fillViewport: false,
        centerBody: true,
      };
  }
}
