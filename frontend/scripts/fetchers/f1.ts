import { getJson } from "./http.js";
import type { RawGame } from "./espn.js";

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
    for (const race of races) {
      if (!race.date || !race.time) continue;
      games.push({
        id: `f1-${year}-${race.round}`,
        team: "f1",
        title: race.raceName,
        venue: race.Circuit?.circuitName,
        startUtc: `${race.date}T${race.time}`,
      });
    }
  }

  return games;
}
