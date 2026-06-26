export function normalizeImageUrl(rawUrl: string | null | undefined): string {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    if (url.hostname === "drive.google.com") {
      const fileId = extractGoogleDriveFileId(url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
      }
    }

    if (url.hostname === "www.dropbox.com" || url.hostname === "dropbox.com") {
      url.searchParams.delete("dl");
      url.searchParams.set("raw", "1");
      return url.toString();
    }

    return url.toString();
  } catch {
    return encodeURI(withProtocol);
  }
}

function extractGoogleDriveFileId(url: URL): string | null {
  const byQuery = url.searchParams.get("id");
  if (byQuery) {
    return byQuery;
  }

  const match = url.pathname.match(/\/file\/d\/([^/]+)/);
  return match?.[1] ?? null;
}
