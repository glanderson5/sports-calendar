import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchVikingsGames, fetchLynxGames, fetchTottenhamGames, type RawGame } from "./fetchers/espn.js";
import { fetchF1Games } from "./fetchers/f1.js";
import { TEAMS, type TeamKey } from "../src/teams.js";
import type { Game, GamesData } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FETCHERS: Record<TeamKey, () => Promise<RawGame[]>> = {
  vikings: fetchVikingsGames,
  lynx: fetchLynxGames,
  tottenham: fetchTottenhamGames,
  f1: fetchF1Games,
};

async function main() {
  const teams = Object.keys(FETCHERS) as TeamKey[];
  const results = await Promise.allSettled(teams.map((team) => FETCHERS[team]()));

  const games: Game[] = [];
  results.forEach((result, i) => {
    const team = teams[i];
    if (result.status === "fulfilled") {
      const info = TEAMS[team];
      for (const g of result.value) {
        games.push({
          ...g,
          opponent: g.opponent ?? null,
          isHome: g.isHome ?? null,
          venue: g.venue ?? null,
          result: g.result ?? null,
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

  const out: GamesData = { generatedAt: new Date().toISOString(), games };
  const outPath = path.join(__dirname, "..", "public", "games.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${games.length} games to ${outPath}`);

  if (games.length === 0) {
    throw new Error("No games fetched from any source — refusing to write an empty schedule silently.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
