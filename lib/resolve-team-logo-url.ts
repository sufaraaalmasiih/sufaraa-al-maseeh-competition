export type TeamLogoMap = ReadonlyMap<string, string>;

export function resolveTeamLogoUrl(
  teamId: string,
  logoUrl: string | null | undefined,
  logosMap: TeamLogoMap,
): string | null {
  if (typeof logoUrl === "string" && logoUrl.length > 0) {
    return logoUrl;
  }

  const fromTeams = logosMap.get(teamId);
  return fromTeams ?? null;
}
