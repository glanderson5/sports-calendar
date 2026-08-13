import { getJson } from "./http.js";

export interface StandingEntry {
  rank: number;
  team: string;
  wins?: number;
  losses?: number;
  ties?: number;
  winPercent?: string;
  points?: number;
  streak?: string;
}

export interface StandingsGroup {
  label: string;
  entries: StandingEntry[];
}

function statValue(stats: any[], name: string): string | undefined {
  return stats.find((s) => s.name === name)?.displayValue;
}

function baseFields(e: any): Omit<StandingEntry, "rank"> {
  const stats: any[] = e.stats ?? [];
  const ties = statValue(stats, "ties");
  const points = statValue(stats, "points");
  return {
    team: e.team.displayName,
    wins: Number(statValue(stats, "wins") ?? 0),
    losses: Number(statValue(stats, "losses") ?? 0),
    ties: ties !== undefined ? Number(ties) : undefined,
    winPercent: statValue(stats, "winPercent"),
    points: points !== undefined ? Number(points) : undefined,
    streak: statValue(stats, "streak"),
  };
}

function playoffSeedRank(e: any): number {
  return Number(statValue(e.stats ?? [], "playoffSeed") ?? 0);
}

// NFC/AFC, each pre-grouped by ESPN with tiebreakers already resolved via playoffSeed.
export async function fetchNflStandings(): Promise<StandingsGroup[]> {
  const data = await getJson("https://site.api.espn.com/apis/v2/sports/football/nfl/standings");
  const groups: StandingsGroup[] = (data.children ?? []).map((c: any) => ({
    label: c.name.includes("National") ? "NFC" : c.name.includes("American") ? "AFC" : c.name,
    entries: c.standings.entries
      .map((e: any) => ({ ...baseFields(e), rank: playoffSeedRank(e) }))
      .sort((a: StandingEntry, b: StandingEntry) => a.rank - b.rank),
  }));
  // Vikings are NFC — show that conference by default.
  groups.sort((a, b) => Number(b.label === "NFC") - Number(a.label === "NFC"));
  return groups;
}

// ESPN groups WNBA teams by conference for display, but the WNBA hasn't
// used conference-based playoff seeding since 2016 — and ESPN's
// `playoffSeed` here turns out to be conference-relative (two teams can
// both be "seed 1"), so it can't be used to merge them. Sort by actual win
// percentage instead to get one true league table.
export async function fetchWnbaStandings(): Promise<StandingsGroup[]> {
  const data = await getJson("https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings");
  const merged = (data.children ?? []).flatMap((c: any) => c.standings.entries);
  const withPct = merged.map((e: any) => {
    const fields = baseFields(e);
    const pct = fields.wins || fields.losses ? (fields.wins ?? 0) / ((fields.wins ?? 0) + (fields.losses ?? 0)) : 0;
    return { fields, pct };
  });
  withPct.sort((a, b) => b.pct - a.pct || (b.fields.wins ?? 0) - (a.fields.wins ?? 0));
  const entries: StandingEntry[] = withPct.map((x, i) => ({ ...x.fields, rank: i + 1 }));
  return [{ label: "League", entries }];
}

// Single unified table; ESPN doesn't expose a rank stat for soccer, but
// entries come back pre-sorted by table position.
export async function fetchEplStandings(): Promise<StandingsGroup[]> {
  const data = await getJson("https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings");
  const table = data.children?.[0];
  const entries: StandingEntry[] = (table?.standings?.entries ?? []).map((e: any, i: number) => ({
    ...baseFields(e),
    rank: i + 1,
  }));
  return [{ label: table?.name ?? "Premier League", entries }];
}

export async function fetchF1Standings(): Promise<StandingsGroup[]> {
  const year = new Date().getUTCFullYear();
  const [driversData, constructorsData] = await Promise.all([
    getJson(`https://api.jolpi.ca/ergast/f1/${year}/driverstandings.json`),
    getJson(`https://api.jolpi.ca/ergast/f1/${year}/constructorstandings.json`),
  ]);
  const driverList: any[] = driversData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  const constructorList: any[] =
    constructorsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];

  return [
    {
      label: "Drivers",
      entries: driverList.map((d) => ({
        rank: Number(d.position),
        team: `${d.Driver.givenName} ${d.Driver.familyName}`,
        wins: Number(d.wins),
        points: Number(d.points),
      })),
    },
    {
      label: "Constructors",
      entries: constructorList.map((c) => ({
        rank: Number(c.position),
        team: c.Constructor.name,
        wins: Number(c.wins),
        points: Number(c.points),
      })),
    },
  ];
}
