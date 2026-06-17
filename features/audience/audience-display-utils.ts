export const AUDIENCE_DISPLAY_PATH = "/audience";
export const AUDIENCE_EMBED_PATH = "/audience?embed=1";

export function isAudienceEmbeddedView(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.self !== window.top) {
    return true;
  }

  return new URLSearchParams(window.location.search).get("embed") === "1";
}

export function getAudienceEmbedSrc(): string {
  return AUDIENCE_EMBED_PATH;
}

export function getAudienceDisplayUrl(): string {
  if (typeof window === "undefined") {
    return AUDIENCE_DISPLAY_PATH;
  }

  return new URL(AUDIENCE_DISPLAY_PATH, window.location.origin).toString();
}

/** Opens audience display in a new tab. Returns false when the browser blocks popups. */
export function openAudienceDisplayTab(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const opened = window.open(getAudienceDisplayUrl(), "_blank", "noopener,noreferrer");
  return opened !== null;
}
