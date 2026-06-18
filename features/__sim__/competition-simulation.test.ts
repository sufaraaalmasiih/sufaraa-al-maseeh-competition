/**
 * محاكاة شاملة للمنطق الحتمي للمسابقة (تعمل فعلياً عبر vitest):
 * - توزيع أسئلة المرحلة 3 على الفرق + الأسئلة الزائدة الجماعية (النقطة 15)
 * - ترتيب الأدوار (يبدأ صاحب أعلى نقاط — النقطة 14)
 * - المراكز المشتركة + كسر التعادل بالأسرع (النقطتان 1 و2)
 * - مرونة Excel: زيادة/نقصان/تغيير الأنواع والمراحل + جولات التوصيل (5، 18، 20)
 *
 * تطبع تقريراً مفصّلاً وتؤكّد الثوابت كحارس انحدار.
 */
import { describe, expect, it } from "vitest";
import {
  buildStage3TurnOrder,
  getNextTurnIndex,
  resolveOwnerFromTurnOrder,
  type Stage3TurnTeamSnapshot,
} from "@/features/stage3/stage3-turn-order";
import {
  computeStage3PointsDelta,
  getStage3LeftoverCount,
  isStage3CollectiveSelection,
} from "@/features/stage3/stage3-scoring";
import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";
import { rankStage1Teams } from "@/features/stage1/stage1-ranking";
import {
  countStage2Questions,
  MAX_MATCHING_PAIRS_PER_SCREEN,
  parseWorkbookRowsToBank,
} from "@/features/facilitator/question-bank-workbook-parser";

const log = (...args: unknown[]) => console.log(...args);

function makeTeams(count: number): Stage3TurnTeamSnapshot[] {
  // نقاط تنازلية حتى نتحقق أن صاحب الأعلى يبدأ
  return Array.from({ length: count }, (_, i) => ({
    teamId: `team-${i + 1}`,
    teamName: `فريق ${i + 1}`,
    totalScore: (count - i) * 10, // فريق 1 = الأعلى
  }));
}

/** يحاكي اختيار `total` سؤالاً بالتناوب ويصنّف كل سؤال (صاحب دور أم جماعي). */
function simulateStage3(teamCount: number, total: number) {
  const turnOrder = buildStage3TurnOrder(makeTeams(teamCount));
  const ownerTurns = new Map<string, number>();
  let collectiveCount = 0;
  let turnIndex = 0;

  for (let used = 0; used < total; used += 1) {
    const collective = isStage3CollectiveSelection(used, total, teamCount);
    const owner = resolveOwnerFromTurnOrder(turnOrder, turnIndex);

    if (collective) {
      collectiveCount += 1;
      // الأسئلة الجماعية لا تستهلك دوراً مالكاً (لا أفضلية) — لا نُدوّر المالك
    } else {
      ownerTurns.set(owner!.teamId, (ownerTurns.get(owner!.teamId) ?? 0) + 1);
      turnIndex = getNextTurnIndex(turnIndex, teamCount);
    }
  }

  return { turnOrder, ownerTurns, collectiveCount };
}

describe("محاكاة 1 — توزيع المرحلة 3 + الأسئلة الجماعية (النقاط 14،15)", () => {
  const scenarios = [
    { teams: 3, total: 30 },
    { teams: 4, total: 25 },
    { teams: 4, total: 30 },
    { teams: 5, total: 30 },
    { teams: 4, total: 24 },
  ];

  for (const { teams, total } of scenarios) {
    it(`${total} سؤال / ${teams} فرق`, () => {
      const { turnOrder, ownerTurns, collectiveCount } = simulateStage3(teams, total);
      const leftover = getStage3LeftoverCount(total, teams);

      // النقطة 14: صاحب أعلى نقاط يبدأ
      expect(turnOrder[0].teamId).toBe("team-1");

      // النقطة 15: عدد الأسئلة الجماعية = الباقي
      expect(collectiveCount).toBe(leftover);

      // الأسئلة غير الجماعية تُوزَّع بالتساوي على الفرق
      const perTeam = Array.from(ownerTurns.values());
      const nonCollective = total - leftover;
      const expectedEach = nonCollective / teams;
      perTeam.forEach((count) => expect(count).toBe(expectedEach));

      // نقاط: مالك سؤال صعب غير جماعي = +45 ؛ نفس السؤال جماعياً = +15 (مسطّح)
      const ownerHard = computeStage3PointsDelta(true, "hard", "correct", false);
      const collectiveHard = computeStage3PointsDelta(true, "hard", "correct", true);
      expect(ownerHard).toBe(45);
      expect(collectiveHard).toBe(15);

      log(
        `\n  [م3] ${total}س/${teams}ف → جماعية=${collectiveCount} (باقي=${leftover}) | ` +
          `أدوار لكل فريق=${expectedEach} | يبدأ=${turnOrder[0].teamName} | ` +
          `مالك-صعب=+${ownerHard} جماعي-صعب=+${collectiveHard}`,
      );
    });
  }
});

describe("محاكاة 2 — المراكز المشتركة + كسر التعادل بالأسرع (النقاط 1،2)", () => {
  it("نفس العلامة = نفس المركز، والأسرع يتقدّم في الترتيب", () => {
    // فريقان متعادلان (50)، أحدهما أنهى أسرع (أقدم زمنياً)
    const base = {
      governorate: "—",
      ready: true,
      competitionIntroReady: true,
      stage1IntroReady: true,
      stage2IntroReady: true,
      stage3IntroReady: true,
      stage4IntroReady: true,
      stage1QuestionIndex: 0,
    };
    const ranked = rankStage1Teams([
      { teamId: "a", teamName: "أ", stage1Score: 50, totalScore: 50, finishedAtMs: 2000, ...base },
      { teamId: "b", teamName: "ب", stage1Score: 50, totalScore: 50, finishedAtMs: 1000, ...base },
      { teamId: "c", teamName: "ج", stage1Score: 30, totalScore: 30, finishedAtMs: 500, ...base },
    ]);

    // الأسرع (b، finishedAtMs أقدم) يأتي أولاً بين المتعادلين
    expect(ranked[0].teamId).toBe("b");
    expect(ranked[1].teamId).toBe("a");
    // مراكز مشتركة: 1, 1, 3
    expect(ranked.map((t) => t.rank)).toEqual([1, 1, 3]);

    log(
      `\n  [ترتيب] ${ranked
        .map((t) => `${t.teamName}:م${t.rank}(${t.totalScore})`)
        .join(" · ")}`,
    );
  });

  it("assignCompetitionRanks ينتج 1,1,3,3,5 و compareFinishSpeed آمن", () => {
    const ranked = assignCompetitionRanks(
      [
        { id: "a", s: 50 },
        { id: "b", s: 50 },
        { id: "c", s: 30 },
        { id: "d", s: 30 },
        { id: "e", s: 10 },
      ],
      (x) => x.s,
    );
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3, 3, 5]);
    expect(compareFinishSpeed(null, undefined)).toBe(0); // لا NaN
    expect(compareFinishSpeed(100, 200)).toBeLessThan(0);
  });
});

describe("محاكاة 3 — مرونة Excel: زيادة/نقصان/أنواع/مراحل/جولات (5،18،20)", () => {
  type Row = Record<string, unknown>;

  function s1(id: string, type: string): Row {
    return { id, stage: "stage1", type, question: `س${id}`, correct: "إجابة", option1: "أ", option2: "ب" };
  }
  function matching(base: string, i: number): Row {
    return { id: `${base}-${i}`, stage: "stage2", type: "matching", question: `يسار${i}`, correct: `يمين${i}` };
  }
  function s3(id: string, field: string, level: string): Row {
    return {
      id, stage: "stage3", type: "multiple_choice",
      question: `س3-${id}`, correct: "أ", option1: "أ", option2: "ب",
      category: field, level,
    };
  }
  function s4(id: string): Row {
    return { id, stage: "stage4", type: "fill_blank", question: `س4-${id}`, correct: "إجابة" };
  }

  it("زيادة/نقصان أسئلة كل مرحلة ينعكس في العدّ", () => {
    const few = parseWorkbookRowsToBank([s1("a", "fill_blank"), s4("z1")]);
    const many = parseWorkbookRowsToBank([
      s1("a", "fill_blank"), s1("b", "multiple_choice"), s1("c", "arrange"),
      s4("z1"), s4("z2"), s4("z3"), s4("z4"),
    ]);
    expect(many.stage1.length).toBeGreaterThan(few.stage1.length);
    expect(many.stage4.length).toBe(4);
    expect(few.stage4.length).toBe(1);
    log(`\n  [Excel] م1: ${few.stage1.length}→${many.stage1.length} | م4: ${few.stage4.length}→${many.stage4.length}`);
  });

  it("تغيير نوع السؤال في المرحلة الأولى يعمل", () => {
    const bank = parseWorkbookRowsToBank([
      s1("a", "fill_blank"),
      s1("b", "multiple_choice"),
      s1("c", "arrange"),
      s1("d", "missing"),
    ]);
    const types = new Set(bank.stage1.map((q) => q.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
    log(`\n  [Excel] أنواع م1 المُحمَّلة: ${[...types].join(", ")}`);
  });

  it("تغيير stage ينقل السؤال بين المراحل", () => {
    const asS4 = parseWorkbookRowsToBank([{ ...s4("x1") }]);
    const movedToS3 = parseWorkbookRowsToBank([
      { ...s4("x1"), stage: "stage3", category: "characters", level: "easy" },
    ]);
    expect(asS4.stage4.length).toBe(1);
    expect(Object.keys(movedToS3.stage3).length).toBe(1);
    expect(movedToS3.stage4.length).toBe(0);
    log(`\n  [Excel] نقل سؤال s4→s3: stage4=${movedToS3.stage4.length} stage3=${Object.keys(movedToS3.stage3).length}`);
  });

  it("جولات التوصيل من Excel: 6 و11 و15 زوجاً", () => {
    const r6 = parseWorkbookRowsToBank(Array.from({ length: 6 }, (_, i) => matching("m6", i + 1)));
    const r11 = parseWorkbookRowsToBank(Array.from({ length: 11 }, (_, i) => matching("m11", i + 1)));
    const r15 = parseWorkbookRowsToBank(Array.from({ length: 15 }, (_, i) => matching("m15", i + 1)));
    expect(r6.stage2.matching.length).toBe(2); // 5 + 1
    expect(r11.stage2.matching.length).toBe(3); // 5 + 5 + 1
    expect(r15.stage2.matching.length).toBe(3); // 5 + 5 + 5
    [r6, r11, r15].forEach((bank) =>
      bank.stage2.matching.forEach((q) =>
        expect(q.pairs.length).toBeLessThanOrEqual(MAX_MATCHING_PAIRS_PER_SCREEN),
      ),
    );
    log(`\n  [Excel] جولات التوصيل: 6→${r6.stage2.matching.length} · 11→${r11.stage2.matching.length} · 15→${r15.stage2.matching.length}`);
  });

  it("كل أنواع المرحلة الثانية الأربعة تُحمَّل وتُعدّ", () => {
    const bank = parseWorkbookRowsToBank([
      matching("m", 1), matching("m", 2),
      { id: "av1", stage: "stage2", type: "arrangeVerse", question: "رتب", data: "جزء1|جزء2|جزء3", correct: "جزء1|جزء2|جزء3" },
      { id: "cv1", stage: "stage2", type: "completeVerse", question: "أكمل", data: "الآية ___", correct: "الكلمة" },
      { id: "tf1", stage: "stage2", type: "trueFalseCorrect", question: "عبارة", correct: "صح" },
    ]);
    expect(bank.stage2.matching.length).toBe(1);
    expect(bank.stage2.arrangeVerse.length).toBe(1);
    expect(bank.stage2.completeVerse.length).toBe(1);
    expect(bank.stage2.trueFalseCorrect.length).toBe(1);
    expect(countStage2Questions(bank.stage2)).toBe(4);
    log(`\n  [Excel] م2 الحقول الأربعة: توصيل=${bank.stage2.matching.length} رتب=${bank.stage2.arrangeVerse.length} أكمل=${bank.stage2.completeVerse.length} صح/خطأ=${bank.stage2.trueFalseCorrect.length}`);
  });

  it("المرحلة الثالثة: زيادة/نقصان عبر صفوف Excel", () => {
    const small = parseWorkbookRowsToBank([s3("q1", "characters", "easy"), s3("q2", "miracles", "hard")]);
    const big = parseWorkbookRowsToBank([
      s3("q1", "characters", "easy"), s3("q2", "miracles", "hard"),
      s3("q3", "parables", "medium"), s3("q4", "numbers", "easy"),
    ]);
    expect(Object.keys(small.stage3).length).toBe(2);
    expect(Object.keys(big.stage3).length).toBe(4);
    log(`\n  [Excel] م3: ${Object.keys(small.stage3).length}→${Object.keys(big.stage3).length}`);
  });
});

describe("محاكاة 4 — أعداد فرق كبيرة: سلامة المنطق + ثبات التوزيع", () => {
  const STAGE3_TOTAL = 30; // لوحة المرحلة 3 الثابتة
  const bigCounts = [8, 12, 16, 20, 24, 40];

  for (const teams of bigCounts) {
    it(`${teams} فريقاً — توزيع م3 ثابت وصحيح`, () => {
      const { turnOrder, ownerTurns, collectiveCount } = simulateStage3(teams, STAGE3_TOTAL);
      const leftover = getStage3LeftoverCount(STAGE3_TOTAL, teams);
      const ownerPerTeam = Math.floor(STAGE3_TOTAL / teams);

      // ترتيب الأدوار يحوي كل الفرق بلا تكرار، ويبدأ بالأعلى
      expect(turnOrder).toHaveLength(teams);
      expect(new Set(turnOrder.map((t) => t.teamId)).size).toBe(teams);
      expect(turnOrder[0].teamId).toBe("team-1");

      // الجماعية = الباقي، وغير الجماعية موزّعة بالتساوي
      expect(collectiveCount).toBe(leftover);
      const distinctOwners = ownerTurns.size;
      if (ownerPerTeam > 0) {
        // كل فريق يأخذ عدد أدوار متساوياً (floor)
        Array.from(ownerTurns.values()).forEach((c) => expect(c).toBe(ownerPerTeam));
        expect(distinctOwners).toBe(teams);
      } else {
        // فرق أكثر من الأسئلة ⇒ لا أدوار فردية، كل الأسئلة جماعية
        expect(collectiveCount).toBe(STAGE3_TOTAL);
      }

      const collectivePct = Math.round((collectiveCount / STAGE3_TOTAL) * 100);
      log(
        `\n  [م3 كبير] ${teams}ف/30س → أدوار/فريق=${ownerPerTeam} · جماعية=${collectiveCount} (${collectivePct}%)`,
      );
    });
  }

  it("ملاحظة سلاسة: نسبة الأسئلة الجماعية ترتفع كلما زادت الفرق نسبةً للأسئلة", () => {
    // توثيق سلوكي: 16ف/30س ⇒ 14 جماعية (سؤال فردي واحد لكل فريق)
    expect(getStage3LeftoverCount(30, 16)).toBe(14);
    expect(getStage3LeftoverCount(30, 20)).toBe(10);
    // 40 فريقاً > 30 سؤال ⇒ الكل جماعي
    expect(isStage3CollectiveSelection(0, 30, 40)).toBe(true);
    expect(isStage3CollectiveSelection(29, 30, 40)).toBe(true);
  });
});

describe("محاكاة 5 — الترتيب يتوسّع مع أعداد فرق كبيرة (مراكز مشتركة)", () => {
  for (const teams of [12, 20, 30]) {
    it(`${teams} فريقاً — مراكز صحيحة مع تعادلات`, () => {
      const base = {
        governorate: "—", ready: true,
        competitionIntroReady: true, stage1IntroReady: true,
        stage2IntroReady: true, stage3IntroReady: true, stage4IntroReady: true,
        stage1QuestionIndex: 0,
      };
      // نصف الفرق بنقاط متساوية (تعادل) والنصف بنقاط متفاوتة
      const input = Array.from({ length: teams }, (_, i) => {
        const tied = i < Math.floor(teams / 2);
        const score = tied ? 100 : 100 - (i - Math.floor(teams / 2) + 1) * 5;
        return {
          teamId: `t${i}`, teamName: `ف${i}`,
          stage1Score: score, totalScore: score,
          finishedAtMs: 1000 + i, // الأسرع أقدم
          ...base,
        };
      });

      const ranked = rankStage1Teams(input);
      const tiedCount = Math.floor(teams / 2);

      // كل المتعادلين (نفس العلامة) لهم نفس المركز = 1
      const topRanks = ranked.slice(0, tiedCount).map((t) => t.rank);
      expect(new Set(topRanks).size).toBe(1);
      expect(topRanks[0]).toBe(1);
      // المركز التالي يقفز بعد المتعادلين (ترتيب رياضي 1..1, ثم tiedCount+1)
      expect(ranked[tiedCount].rank).toBe(tiedCount + 1);
      // لا مركز يتجاوز عدد الفرق
      ranked.forEach((t) => expect(t.rank).toBeLessThanOrEqual(teams));

      log(
        `\n  [ترتيب كبير] ${teams}ف → ${tiedCount} متعادلون بمركز 1، التالي مركز ${ranked[tiedCount].rank}`,
      );
    });
  }
});
