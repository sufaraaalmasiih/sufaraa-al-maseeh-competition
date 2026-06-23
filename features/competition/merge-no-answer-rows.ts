import type { RevealResultsAnswerRow } from "@/features/stage4/reveal-results-answer-row";

export interface RevealTeamRef {
  teamId: string;
  teamName: string;
}

/**
 * يدمج كل الفرق في صفوف الإعلان: الفرق التي لم تُسجّل إجابة (تخطّت أو لم تُجِب) تظهر
 * أيضاً للجمهور كأنها أجابت لكن بنتيجة «لم يجيب». يُستخدم في إعلان المرحلتين 3 و4،
 * حيث لا يُجيب كل الفرق على كل سؤال (#9/#10).
 */
export function mergeNoAnswerRows(
  answers: RevealResultsAnswerRow[],
  allTeams: RevealTeamRef[],
): RevealResultsAnswerRow[] {
  const answeredTeamIds = new Set(answers.map((row) => row.teamId));

  const missingRows: RevealResultsAnswerRow[] = allTeams
    .filter((team) => team.teamId && !answeredTeamIds.has(team.teamId))
    .map((team) => ({
      answerDocId: `no-answer-${team.teamId}`,
      teamId: team.teamId,
      teamName: team.teamName,
      answerText: "—",
      passed: false,
      confirmed: true,
      isCorrect: false,
      pointsDelta: 0,
      streakBefore: 0,
      streakAfter: 0,
      outcome: "no_answer",
    }));

  return [...answers, ...missingRows].sort((first, second) =>
    first.teamName.localeCompare(second.teamName, "ar"),
  );
}

/** شاشة المتسابق: صف واحد لإجابة الفريق الحالي فقط. */
export function filterRevealRowsForTeam(
  answers: RevealResultsAnswerRow[],
  teamId: string | null,
): RevealResultsAnswerRow[] {
  if (!teamId) {
    return [];
  }

  const mine = answers.find((row) => row.teamId === teamId);
  if (mine) {
    return [mine];
  }

  return [
    {
      answerDocId: `no-answer-${teamId}`,
      teamId,
      teamName: "فريقك",
      answerText: "—",
      passed: false,
      confirmed: true,
      isCorrect: false,
      pointsDelta: 0,
      streakBefore: 0,
      streakAfter: 0,
      outcome: "no_answer",
    },
  ];
}
