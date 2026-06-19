/**
 * اختبارات أمان قواعد Firestore — تعمل عبر Firebase Emulator.
 * شغّلها بـ:  npm run test:rules
 * (تتطلب Java + firebase-tools؛ لا تستهلك أي حصة من الباقة المجانية لأنها محلية.)
 */
import { readFileSync } from "fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-sufaraa-rules";
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // بذور البيانات (تجاوز القواعد) لإعداد الأدوار والمستندات.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "teams/team1"), { teamName: "ت1", role: "team", active: true });
    await setDoc(doc(db, "teams/team2"), { teamName: "ت2", role: "team", active: true });
    await setDoc(doc(db, "users/fac1"), { role: "facilitator" });
    await setDoc(doc(db, "competitions/main/teamStates/team1"), {
      teamId: "team1",
      totalScore: 50,
      stageScores: { stage1: 50 },
    });
    await setDoc(doc(db, "competitions/main/teamArchives/s1__team1"), {
      teamId: "team1",
      total: 10,
      rank: 1,
    });
    await setDoc(doc(db, "competitions/main/objections/o1"), {
      teamId: "team1",
      note: "اعتراض",
      status: "open",
    });
    await setDoc(doc(db, "competitions/main/history/s1"), { title: "مسابقة" });
  });
});

function team(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}
function facilitator() {
  return testEnv.authenticatedContext("fac1").firestore();
}
function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

describe("teams — ملف الفريق", () => {
  it("الفريق يقرأ ملفه فقط، ولا يقرأ فريقاً آخر", async () => {
    await assertSucceeds(getDoc(doc(team("team1"), "teams/team1")));
    await assertFails(getDoc(doc(team("team1"), "teams/team2")));
  });
  it("الميسّر يقرأ أي فريق", async () => {
    await assertSucceeds(getDoc(doc(facilitator(), "teams/team1")));
  });
});

describe("teamStates — النقاط المحدودة (مكافحة التلاعب)", () => {
  it("الفريق يزيد نقاطه ضمن الحد المسموح (+25 كحد أقصى)", async () => {
    await assertSucceeds(
      updateDoc(doc(team("team1"), "competitions/main/teamStates/team1"), {
        totalScore: 70, // +20 ضمن الحد
      }),
    );
  });
  it("الفريق لا يستطيع قفز نقاطه فوق الحد", async () => {
    await assertFails(
      updateDoc(doc(team("team1"), "competitions/main/teamStates/team1"), {
        totalScore: 500, // +450 ممنوع
      }),
    );
  });
  it("الفريق لا يعدّل نقاط فريق آخر", async () => {
    await assertFails(
      updateDoc(doc(team("team2"), "competitions/main/teamStates/team1"), {
        totalScore: 60,
      }),
    );
  });
});

describe("answers — حدود الإجابة", () => {
  it("الفريق يُنشئ إجابته بنقاط ضمن الحد", async () => {
    await assertSucceeds(
      setDoc(doc(team("team1"), "competitions/main/answers/a1"), {
        teamId: "team1",
        confirmed: true,
        isCorrect: true,
        pointsDelta: 15,
      }),
    );
  });
  it("الفريق لا يُنشئ إجابة بنقاط خارج الحد", async () => {
    await assertFails(
      setDoc(doc(team("team1"), "competitions/main/answers/a2"), {
        teamId: "team1",
        confirmed: true,
        isCorrect: true,
        pointsDelta: 1000,
      }),
    );
  });
  it("الفريق لا يُنشئ إجابة باسم فريق آخر", async () => {
    await assertFails(
      setDoc(doc(team("team1"), "competitions/main/answers/a3"), {
        teamId: "team2",
        confirmed: true,
        isCorrect: true,
        pointsDelta: 15,
      }),
    );
  });
});

describe("history — السجل (للميسّر فقط)", () => {
  it("الميسّر يقرأ السجل", async () => {
    await assertSucceeds(getDoc(doc(facilitator(), "competitions/main/history/s1")));
  });
  it("الفريق لا يقرأ السجل", async () => {
    await assertFails(getDoc(doc(team("team1"), "competitions/main/history/s1")));
  });
});

describe("teamArchives — خصوصية أرشيف الفريق", () => {
  it("الفريق يقرأ أرشيفه فقط", async () => {
    await assertSucceeds(
      getDoc(doc(team("team1"), "competitions/main/teamArchives/s1__team1")),
    );
  });
  it("الفريق لا يقرأ أرشيف فريق آخر", async () => {
    await assertFails(
      getDoc(doc(team("team2"), "competitions/main/teamArchives/s1__team1")),
    );
  });
  it("الميسّر يقرأ أي أرشيف، والفريق لا يكتب الأرشيف", async () => {
    await assertSucceeds(
      getDoc(doc(facilitator(), "competitions/main/teamArchives/s1__team1")),
    );
    await assertFails(
      setDoc(doc(team("team1"), "competitions/main/teamArchives/s2__team1"), {
        teamId: "team1",
        total: 5,
      }),
    );
  });
});

describe("objections — اعتراضات المدرب", () => {
  it("الفريق يُنشئ اعتراضه فقط", async () => {
    await assertSucceeds(
      setDoc(doc(team("team1"), "competitions/main/objections/o2"), {
        teamId: "team1",
        note: "اعتراض جديد",
        status: "open",
      }),
    );
  });
  it("الفريق لا يُنشئ اعتراضاً باسم فريق آخر", async () => {
    await assertFails(
      setDoc(doc(team("team1"), "competitions/main/objections/o3"), {
        teamId: "team2",
        note: "تزوير",
        status: "open",
      }),
    );
  });
  it("الفريق يقرأ اعتراضه، ولا يقرأ اعتراض غيره", async () => {
    await assertSucceeds(
      getDoc(doc(team("team1"), "competitions/main/objections/o1")),
    );
    await assertFails(
      getDoc(doc(team("team2"), "competitions/main/objections/o1")),
    );
  });
  it("الفريق لا يحكّم (يحدّث) الاعتراض؛ الميسّر يستطيع", async () => {
    await assertFails(
      updateDoc(doc(team("team1"), "competitions/main/objections/o1"), {
        status: "reviewed",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(facilitator(), "competitions/main/objections/o1"), {
        status: "reviewed",
      }),
    );
  });
});

describe("system — gameFlow عام للقراءة، محمي للكتابة", () => {
  it("الجمهور (غير مسجّل) يقرأ gameFlow", async () => {
    await assertSucceeds(getDoc(doc(anon(), "competitions/main/system/gameFlow")));
  });
  it("الفريق لا يكتب gameFlow بشكل تعسّفي", async () => {
    await assertFails(
      setDoc(doc(team("team1"), "competitions/main/system/gameFlow"), {
        status: "podium",
      }),
    );
  });
  it("الميسّر يكتب gameFlow", async () => {
    await assertSucceeds(
      setDoc(doc(facilitator(), "competitions/main/system/gameFlow"), {
        status: "stage1_running",
      }),
    );
  });
});
