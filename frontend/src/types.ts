import type { TeamKey } from "./teams";

export interface Game {
  id: string;
  team: TeamKey;
  title: string;
  opponent: string | null;
  isHome: boolean | null;
  startUtc: string;
  venue: string | null;
  teamLabel: string;
  sport: string;
  color: string;
  /** Human-readable outcome, precomputed at fetch time. Absent/undefined for games not yet played. */
  result: string | null;
}

export interface GamesData {
  generatedAt: string;
  games: Game[];
}
