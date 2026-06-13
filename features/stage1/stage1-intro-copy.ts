import { COMPETITION_INTRO_SUMMARY } from "@/features/gameflow/competition-intro-copy";

export const STAGE1_INTRO_VIDEO_ID = "0rC6j13eyd4";

export const STAGE1_INTRO_COPY = {
  competitionName: COMPETITION_INTRO_SUMMARY.title,
  competitionSlogan: COMPETITION_INTRO_SUMMARY.slogan,
  eyebrow: "المرحلة الأولى",
  stageName: "اجمعوا الكنوز",
  lead: "سباق وقت لجمع أكبر عدد من النقاط من بنك أسئلة كتابي متنوع.",
  details: [
    "7 دقائق — حتى 50 سؤالاً.",
    "5 نقاط لكل إجابة صحيحة.",
    "اختر من متعدد، فراغات، ماذا ينقص، ورتّب.",
    "تتوقف الإجابات عند انتهاء الوقت أو إكمال البنك.",
  ],
  videoTitle: "شرح المرحلة الأولى — اجمعوا الكنوز",
  hint: "بانتظار بدء الميسر للمرحلة الأولى.",
} as const;
