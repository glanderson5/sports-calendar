import { useState } from "react";
import type { Game, GamesData, StandingEntry } from "../types";
import type { TeamKey } from "../teams";
import { TEAMS } from "../teams";
import { CalendarView } from "./CalendarView";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
});

function StandingsTable({ team, entries }: { team: TeamKey; entries: StandingEntry[] }) {
  const ownLabel = TEAMS[team].label;
  // "Record" (W-L[-T]) only makes sense when there's a losses column — F1
  // entries only have a bare win count, which gets its own "Wins" column.
  const showRecord = entries.some((e) => e.losses !== undefined);
  const showWins = !showRecord && entries.some((e) => e.wins !== undefined);
  const showWinPct = entries.some((e) => e.winPercent !== undefined);
  const showPoints = entries.some((e) => e.points !== undefined);
  const showStreak = entries.some((e) => e.streak !== undefined);

  return (
    <div className="standings-table-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            {showRecord && <th>Record</th>}
            {showWins && <th>Wins</th>}
            {showWinPct && <th>Win%</th>}
            {showPoints && <th>Pts</th>}
            {showStreak && <th>Streak</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const record = [e.wins, e.losses, e.ties].filter((v) => v !== undefined).join("-");
            return (
              <tr key={e.rank + e.team} className={e.team === ownLabel ? "own-team-row" : undefined}>
                <td>{e.rank}</td>
                <td>{e.team}</td>
                {showRecord && <td>{record || "—"}</td>}
                {showWins && <td>{e.wins ?? "—"}</td>}
                {showWinPct && <td>{e.winPercent ?? "—"}</td>}
                {showPoints && <td>{e.points ?? "—"}</td>}
                {showStreak && <td>{e.streak ?? "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StandingsSection({ team, data }: { team: TeamKey; data: GamesData }) {
  const groups = data.standings[team] ?? [];
  const [groupIndex, setGroupIndex] = useState(0);
  if (groups.length === 0) return null;
  const active = groups[Math.min(groupIndex, groups.length - 1)];

  return (
    <section>
      <h2>Standings</h2>
      {groups.length > 1 && (
        <div className="standings-toggle">
          {groups.map((g, i) => (
            <button key={g.label} className={i === groupIndex ? "active" : ""} onClick={() => setGroupIndex(i)}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      <StandingsTable team={team} entries={active.entries} />
    </section>
  );
}

function RecentResults({ team, games }: { team: TeamKey; games: Game[] }) {
  const recent = games
    .filter((g) => g.result)
    .sort((a, b) => b.startUtc.localeCompare(a.startUtc))
    .slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <section>
      <h2>Recent Results</h2>
      <ul className="recent-results-list">
        {recent.map((g) => (
          <li key={g.id}>
            <span className="result-date">{dateFormatter.format(new Date(g.startUtc))}</span>
            <span>
              {g.opponent ? `${g.isHome ? "vs" : "@"} ${g.opponent}` : g.title} — <strong>{g.result}</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NewsSection({ team, data }: { team: TeamKey; data: GamesData }) {
  const articles = data.news[team] ?? [];
  if (articles.length === 0) return null;

  return (
    <section>
      <h2>News</h2>
      <div className="news-list">
        {articles.map((a) => (
          <a key={a.url} className="news-card" href={a.url} target="_blank" rel="noreferrer noopener">
            {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" />}
            <div>
              <div className="news-headline">{a.headline}</div>
              {a.description && <div className="news-description">{a.description}</div>}
              <div className="news-date">{dateFormatter.format(new Date(a.published))}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function TeamPage({ team, data }: { team: TeamKey; data: GamesData }) {
  const info = TEAMS[team];
  const teamGames = data.games.filter((g) => g.team === team);

  return (
    <div className="team-page">
      <h1 style={{ color: info.color }}>{info.label}</h1>
      <StandingsSection team={team} data={data} />
      <RecentResults team={team} games={teamGames} />
      <section>
        <h2>Schedule</h2>
        <CalendarView games={teamGames} />
      </section>
      <NewsSection team={team} data={data} />
    </div>
  );
}
