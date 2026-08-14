export type TeamKey = "tottenham" | "vikings" | "lynx" | "timberwolves" | "f1";

export interface TeamInfo {
  key: TeamKey;
  label: string;
  shortLabel: string;
  sport: string;
  /** Background color for calendar events & legend swatches — chosen dark
   *  enough that white event text stays readable (WCAG AA, ~4.5:1+). */
  color: string;
}

export const TEAM_KEYS: TeamKey[] = ["tottenham", "vikings", "lynx", "timberwolves", "f1"];

export const TEAMS: Record<TeamKey, TeamInfo> = {
  tottenham: {
    key: "tottenham",
    label: "Tottenham Hotspur",
    shortLabel: "TOT",
    sport: "Soccer (EPL)",
    color: "#1B3A6B",
  },
  vikings: {
    key: "vikings",
    label: "Minnesota Vikings",
    shortLabel: "VIK",
    sport: "NFL",
    color: "#4F2683",
  },
  lynx: {
    key: "lynx",
    label: "Minnesota Lynx",
    shortLabel: "LYN",
    sport: "WNBA",
    color: "#1B7A43",
  },
  timberwolves: {
    key: "timberwolves",
    label: "Minnesota Timberwolves",
    shortLabel: "WLV",
    sport: "NBA",
    color: "#B5471B",
  },
  f1: {
    key: "f1",
    label: "Formula 1",
    shortLabel: "F1",
    sport: "Racing",
    color: "#B3261E",
  },
};
