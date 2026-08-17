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
  /** Set only when it's not the team's primary league (e.g. "FA Cup"), so cup fixtures read distinctly from league ones. */
  competition: string | null;
}

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

export interface NewsArticle {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string;
  published: string;
}

export interface GamesData {
  generatedAt: string;
  games: Game[];
  standings: Record<TeamKey, StandingsGroup[]>;
  news: Record<TeamKey, NewsArticle[]>;
}
