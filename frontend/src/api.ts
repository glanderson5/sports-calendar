import type { GamesData } from "./types";

export async function fetchGames(): Promise<GamesData> {
  // Relative to BASE_URL so this resolves correctly under a GitHub Pages
  // project subpath (e.g. /sports-calendar/) as well as at the domain root.
  const res = await fetch(`${import.meta.env.BASE_URL}games.json`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load games.json (${res.status})`);
  }
  return res.json();
}
