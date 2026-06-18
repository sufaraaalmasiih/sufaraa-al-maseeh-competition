function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

/** Split a cell value on common Arabic/Latin list separators. */
export function splitPipeList(value: unknown): string[] {
  const text = trim(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[|,;،\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Ordered answers from Excel «correct» column.
 * Numeric-only lists are normalized to ascending order (Excel RTL often permutes digits).
 */
export function parseExcelCorrectOrderList(value: unknown): string[] {
  const parts = splitPipeList(value);
  if (parts.length <= 1) {
    return parts;
  }
  if (parts.every((part) => /^\d+$/.test(part))) {
    return [...parts].sort((first, second) => Number(first) - Number(second));
  }
  return parts;
}
