import type { GamesData } from "./types";

export async function fetchGames(): Promise<GamesData> {
  const res = await fetch("/games.json", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load games.json (${res.status})`);
  }
  return res.json();
}
