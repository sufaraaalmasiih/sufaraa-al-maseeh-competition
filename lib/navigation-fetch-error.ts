export function isNavigationFetchError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";

  if (name === "TypeError" && message === "Failed to fetch") {
    return true;
  }

  return message.includes("fetchServerResponse") || message.includes("router-reducer");
}
