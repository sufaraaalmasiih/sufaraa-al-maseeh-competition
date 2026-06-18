function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value) || value instanceof Date) {
    return false;
  }
  // Preserve Firestore FieldValue sentinels (e.g. serverTimestamp()).
  if ("_methodName" in value) {
    return false;
  }
  return true;
}

/** Remove undefined values recursively — Firestore rejects undefined in documents. */
export function stripUndefinedForFirestore<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefinedForFirestore(entry)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = stripUndefinedForFirestore(entry);
    }
  }
  return result as T;
}
