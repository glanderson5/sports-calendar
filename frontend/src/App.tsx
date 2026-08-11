import { useEffect, useState } from "react";
import { fetchGames } from "./api";
import type { Game } from "./types";
import { TEAMS } from "./teams";
import { CalendarView } from "./components/CalendarView";
import "./styles.css";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames()
      .then((data) => {
        setGames(data.games);
        setGeneratedAt(data.generatedAt);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Sports Calendar</h1>
        {generatedAt && (
          <span className="status updated-at">
            Schedules updated {new Date(generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT
          </span>
        )}
      </header>

      <div className="legend">
        {Object.values(TEAMS).map((t) => (
          <span key={t.key} className="legend-item">
            <span className="swatch" style={{ backgroundColor: t.color }} />
            {t.label}
          </span>
        ))}
      </div>

      {loading && <p className="status">Loading schedules…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && <CalendarView games={games} />}
    </div>
  );
}
