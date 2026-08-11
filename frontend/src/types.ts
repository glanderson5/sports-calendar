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
}

export interface GamesData {
  generatedAt: string;
  games: Game[];
}
