import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchVikingsGames,
  fetchLynxGames,
  fetchTimberwolvesGames,
  fetchTottenhamGames,
  type RawGame,
} from "./fetchers/espn.js";
import { fetchF1Games } from "./fetchers/f1.js";
import {
  fetchNflStandings,
  fetchWnbaStandings,
  fetchNbaStandings,
  fetchEplStandings,
  fetchF1Standings,
} from "./fetchers/standings.js";
import {
  fetchVikingsNews,
  fetchLynxNews,
  fetchTimberwolvesNews,
  fetchTottenhamNews,
  fetchF1News,
} from "./fetchers/news.js";
import { buildIcs } from "./ics.js";
import { TEAMS, TEAM_KEYS, type TeamKey } from "../src/teams.js";
import type { Game, GamesData, StandingsGroup, NewsArticle } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GAME_FETCHERS: Record<TeamKey, () => Promise<RawGame[]>> = {
  vikings: fetchVikingsGames,
  lynx: fetchLynxGames,
  timberwolves: fetchTimberwolvesGames,
  tottenham: fetchTottenhamGames,
  f1: fetchF1Games,
};

const STANDINGS_FETCHERS: Record<TeamKey, () => Promise<StandingsGroup[]>> = {
  vikings: fetchNflStandings,
  lynx: fetchWnbaStandings,
  timberwolves: fetchNbaStandings,
  tottenham: fetchEplStandings,
  f1: fetchF1Standings,
};

const NEWS_FETCHERS: Record<TeamKey, () => Promise<NewsArticle[]>> = {
  vikings: fetchVikingsNews,
  lynx: fetchLynxNews,
  timberwolves: fetchTimberwolvesNews,
  tottenham: fetchTottenhamNews,
  f1: fetchF1News,
};

async function collect<T>(
  label: string,
  fetchers: Record<TeamKey, () => Promise<T>>,
  emptyValue: T
): Promise<Record<TeamKey, T>> {
  const entries = await Promise.all(
    TEAM_KEYS.map(async (team) => {
      try {
        const value = await fetchers[team]();
        return [team, value] as const;
      } catch (err) {
        console.error(`[${label}] ${team} FAILED:`, (err as Error)?.message ?? err);
        return [team, emptyValue] as const;
      }
    })
  );
  return Object.fromEntries(entries) as Record<TeamKey, T>;
}

async function main() {
  const results = await Promise.allSettled(TEAM_KEYS.map((team) => GAME_FETCHERS[team]()));

  const games: Game[] = [];
  results.forEach((result, i) => {
    const team = TEAM_KEYS[i];
    if (result.status === "fulfilled") {
      const info = TEAMS[team];
      for (const g of result.value) {
        games.push({
          ...g,
          opponent: g.opponent ?? null,
          isHome: g.isHome ?? null,
          venue: g.venue ?? null,
          result: g.result ?? null,
          competition: g.competition ?? null,
          teamLabel: info.label,
          sport: info.sport,
          color: info.color,
        });
      }
      console.log(`[fetch] ${team}: ${result.value.length} games`);
    } else {
      console.error(`[fetch] ${team} FAILED:`, (result.reason as Error)?.message ?? result.reason);
    }
  });

  games.sort((a, b) => a.startUtc.localeCompare(b.startUtc));

  const standings = await collect("standings", STANDINGS_FETCHERS, [] as StandingsGroup[]);
  for (const team of TEAM_KEYS) {
    console.log(`[standings] ${team}: ${standings[team].map((g) => `${g.label}(${g.entries.length})`).join(", ")}`);
  }

  const news = await collect("news", NEWS_FETCHERS, [] as NewsArticle[]);
  for (const team of TEAM_KEYS) {
    console.log(`[news] ${team}: ${news[team].length} articles`);
  }

  const out: GamesData = { generatedAt: new Date().toISOString(), games, standings, news };
  const outPath = path.join(__dirname, "..", "public", "games.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${games.length} games to ${outPath}`);

  if (games.length === 0) {
    throw new Error("No games fetched from any source — refusing to write an empty schedule silently.");
  }

  const calendarsDir = path.join(__dirname, "..", "public", "calendars");
  fs.mkdirSync(calendarsDir, { recursive: true });
  fs.writeFileSync(path.join(calendarsDir, "all.ics"), buildIcs(games, "Sports Calendar — All Teams"));
  for (const team of TEAM_KEYS) {
    const teamGames = games.filter((g) => g.team === team);
    fs.writeFileSync(
      path.join(calendarsDir, `${team}.ics`),
      buildIcs(teamGames, `Sports Calendar — ${TEAMS[team].label}`)
    );
  }
  console.log(`Wrote ${TEAM_KEYS.length + 1} .ics feeds to ${calendarsDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
