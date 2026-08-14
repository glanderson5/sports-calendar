import { getJson } from "./http.js";
import type { TeamKey } from "../../src/teams.js";

export interface RawGame {
  id: string;
  team: TeamKey;
  title: string;
  opponent?: string;
  isHome?: boolean;
  startUtc: string;
  venue?: string;
  result?: string;
}

// ESPN team IDs (numeric — abbreviations are unreliable for soccer).
const VIKINGS_TEAM_ID = "16";
const LYNX_TEAM_ID = "8";
const TOTTENHAM_TEAM_ID = "367";
const TIMBERWOLVES_TEAM_ID = "16"; // NBA namespace — distinct from the NFL "16" above.

function nflSeasonYear(): number {
  const now = new Date();
  // The NFL season labeled e.g. "2026" runs Sep 2026 - Feb 2027.
  return now.getUTCMonth() <= 1 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
}

function nbaSeasonYear(): number {
  const now = new Date();
  // Unlike the NFL, ESPN labels an NBA season by its ENDING year — the
  // "2026-27" season (Oct 2026 - Jun 2027) is season=2027. From July
  // onward (off-season, next season's slate is what's relevant) roll
  // forward to that upcoming season.
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

function resultLabel(self: any, opponent: any, comp: any): string | undefined {
  if (!comp?.status?.type?.completed) return undefined;
  const selfScore = self?.score?.displayValue;
  const oppScore = opponent?.score?.displayValue;
  if (selfScore == null || oppScore == null) return undefined;
  const outcome = self?.winner ? "W" : opponent?.winner ? "L" : "D";
  return `${outcome} ${selfScore}–${oppScore}`;
}

function mapEspnEvent(team: TeamKey, teamId: string, ev: any): RawGame {
  const comp = ev.competitions?.[0];
  const competitors: any[] = comp?.competitors ?? [];
  const self = competitors.find((c) => c.team?.id === teamId);
  const opponent = competitors.find((c) => c.team?.id !== teamId);
  return {
    id: `${team}-${ev.id}`,
    team,
    title: ev.name ?? ev.shortName ?? "",
    opponent: opponent?.team?.displayName,
    isHome: self?.homeAway === "home",
    startUtc: ev.date,
    venue: comp?.venue?.fullName,
    result: resultLabel(self, opponent, comp),
  };
}

export async function fetchVikingsGames(): Promise<RawGame[]> {
  const year = nflSeasonYear();
  const games: RawGame[] = [];
  // seasontype 2 = regular season, 3 = postseason
  for (const seasontype of [2, 3]) {
    const data = await getJson(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${VIKINGS_TEAM_ID}/schedule?season=${year}&seasontype=${seasontype}`
    );
    for (const ev of data.events ?? []) {
      games.push(mapEspnEvent("vikings", VIKINGS_TEAM_ID, ev));
    }
  }
  return games;
}

export async function fetchLynxGames(): Promise<RawGame[]> {
  const year = new Date().getUTCFullYear();
  const data = await getJson(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${LYNX_TEAM_ID}/schedule?season=${year}`
  );
  return (data.events ?? [])
    .filter((ev: any) => ev.seasonType?.type !== 1) // skip preseason
    .map((ev: any) => mapEspnEvent("lynx", LYNX_TEAM_ID, ev));
}

export async function fetchTimberwolvesGames(): Promise<RawGame[]> {
  const year = nbaSeasonYear();
  const data = await getJson(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${TIMBERWOLVES_TEAM_ID}/schedule?season=${year}&seasontype=2`
  );
  return (data.events ?? []).map((ev: any) => mapEspnEvent("timberwolves", TIMBERWOLVES_TEAM_ID, ev));
}

// ESPN's per-team schedule endpoint is unpopulated for soccer; the league
// scoreboard over a wide date range works and can be filtered by team.
// (Endpoint rejects date ranges over 365 days.)
export async function fetchTottenhamGames(): Promise<RawGame[]> {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 364 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const data = await getJson(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=${fmt(start)}-${fmt(end)}&limit=1000`
  );
  const games: RawGame[] = [];
  for (const ev of data.events ?? []) {
    const competitors: any[] = ev.competitions?.[0]?.competitors ?? [];
    if (!competitors.some((c) => c.team?.id === TOTTENHAM_TEAM_ID)) continue;
    games.push(mapEspnEvent("tottenham", TOTTENHAM_TEAM_ID, ev));
  }
  return games;
}
