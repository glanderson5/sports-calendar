import { useEffect, useState } from "react";
import { fetchGames } from "./api";
import type { GamesData } from "./types";
import { TEAMS, TEAM_KEYS, type TeamKey } from "./teams";
import { CalendarView } from "./components/CalendarView";
import { TeamPage } from "./components/TeamPage";
import "./styles.css";

type Tab = "home" | TeamKey;

export default function App() {
  const [data, setData] = useState<GamesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    fetchGames()
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Sports Calendar</h1>
        {data && (
          <span className="status updated-at">
            Schedules updated {new Date(data.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT
          </span>
        )}
      </header>

      <nav className="team-tabs">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>
          Home
        </button>
        {TEAM_KEYS.map((key) => {
          const t = TEAMS[key];
          const active = tab === key;
          return (
            <button
              key={key}
              className={active ? "active" : ""}
              style={active ? { background: t.color, borderColor: t.color } : undefined}
              onClick={() => setTab(key)}
            >
              {t.shortLabel}
            </button>
          );
        })}
      </nav>

      {loading && <p className="status">Loading schedules…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && data && (
        <>
          {tab === "home" && (
            <>
              <div className="legend">
                {Object.values(TEAMS).map((t) => (
                  <span key={t.key} className="legend-item">
                    <span className="swatch" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </span>
                ))}
              </div>
              <a className="subscribe-link" href={`${import.meta.env.BASE_URL}calendars/all.ics`}>
                📅 Subscribe to all games in your calendar app
              </a>
              <CalendarView games={data.games} />
            </>
          )}
          {tab !== "home" && <TeamPage team={tab} data={data} />}
        </>
      )}
    </div>
  );
}
