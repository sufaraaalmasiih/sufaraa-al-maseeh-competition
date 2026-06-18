/**
 * نظام ترتيب موحّد لكل جداول المسابقة والنتائج النهائية.
 *
 * - كسر التعادل: من أنهى المرحلة/الجولة أسرع (طابع زمني أقدم) يتقدّم،
 *   ثم اسم الفريق كحل أخير فقط (وليس الترتيب الأبجدي كأساس).
 * - أرقام المراكز: نفس العلامة = نفس المركز (1, 1, 3) — ترتيب رياضي قياسي.
 */

/**
 * مقارنة سرعة الإنهاء: الأصغر (الأقدم زمنياً) يتقدّم.
 * القيم غير المعرّفة تُعامَل كأنها لم تُنهِ بعد فتأتي أخيراً.
 */
export function compareFinishSpeed(
  first: number | null | undefined,
  second: number | null | undefined,
): number {
  const a =
    typeof first === "number" && Number.isFinite(first)
      ? first
      : Number.POSITIVE_INFINITY;
  const b =
    typeof second === "number" && Number.isFinite(second)
      ? second
      : Number.POSITIVE_INFINITY;
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * يمنح المراكز لقائمة مُرتَّبة مسبقاً مع دعم التعادل:
 * الفرق المتساوية في المفتاح (العلامة) تأخذ نفس رقم المركز،
 * والمركز التالي يقفز بمقدار عدد المتعادلين (1, 1, 3).
 */
export function assignCompetitionRanks<T>(
  sortedItems: readonly T[],
  getRankKey: (item: T) => string | number,
): Array<T & { rank: number }> {
  const ranked: Array<T & { rank: number }> = [];
  let previousKey: string | number | null = null;
  let previousRank = 0;

  sortedItems.forEach((item, index) => {
    const key = getRankKey(item);
    let rank: number;

    if (previousKey !== null && key === previousKey) {
      rank = previousRank;
    } else {
      rank = index + 1;
      previousKey = key;
      previousRank = rank;
    }

    ranked.push({ ...item, rank });
  });

  return ranked;
}
