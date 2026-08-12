import { getJson } from "./http.js";
import type { RawGame } from "./espn.js";

// Jolpica caps `limit` at 100 results/page (~4-5 races); paginate with
// `offset` until MRData.total is covered.
async function fetchSeasonWinners(year: number): Promise<Map<string, string>> {
  const winners = new Map<string, string>();
  let offset = 0;
  while (true) {
    let data: any;
    try {
      data = await getJson(`https://api.jolpi.ca/ergast/f1/${year}/results.json?limit=100&offset=${offset}`);
    } catch {
      break;
    }
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    for (const race of races) {
      const winner = race.Results?.find((r: any) => r.position === "1");
      if (winner) {
        winners.set(
          race.round,
          `Winner: ${winner.Driver.givenName} ${winner.Driver.familyName} (${winner.Constructor.name})`
        );
      }
    }
    const total = Number(data?.MRData?.total ?? 0);
    offset += races.reduce((sum: number, r: any) => sum + (r.Results?.length ?? 0), 0) || 100;
    if (offset >= total || races.length === 0) break;
  }
  return winners;
}

export async function fetchF1Games(): Promise<RawGame[]> {
  const currentYear = new Date().getUTCFullYear();
  const games: RawGame[] = [];

  for (const year of [currentYear, currentYear + 1]) {
    let data: any;
    try {
      data = await getJson(`https://api.jolpi.ca/ergast/f1/${year}.json`);
    } catch {
      continue; // next season's calendar may not be published yet
    }
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    if (races.length === 0) continue;

    const winners = await fetchSeasonWinners(year);
    for (const race of races) {
      if (!race.date || !race.time) continue;
      games.push({
        id: `f1-${year}-${race.round}`,
        team: "f1",
        title: race.raceName,
        venue: race.Circuit?.circuitName,
        startUtc: `${race.date}T${race.time}`,
        result: winners.get(race.round),
      });
    }
  }

  return games;
}
