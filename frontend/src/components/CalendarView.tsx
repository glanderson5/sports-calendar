import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type Event, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Game } from "../types";
import { TEAMS } from "../teams";

const CENTRAL_TZ = "America/Chicago";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CENTRAL_TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface CalEvent extends Event {
  resource: Game;
  /** Marks the compact all-day chip (week view only) rather than a real timed block. */
  isSummary?: boolean;
  /** Richer text for the native hover tooltip — timed blocks show no label, so this is their only text. */
  tooltip: string;
}

function centralDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildTimedEvents(games: Game[]): CalEvent[] {
  return games.map((g) => {
    // Shift into Central-time wall-clock values so the calendar (which
    // reads Date fields using the browser's own local timezone) always
    // displays Central time, regardless of the viewer's device timezone.
    const start = toZonedTime(new Date(g.startUtc), CENTRAL_TZ);
    let end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    // Clamp to the end of the start day. Late games (e.g. 9pm+ starts)
    // would otherwise end past midnight, which react-big-calendar reads
    // as a multi-day event and renders in the all-day row instead of
    // the timed grid.
    const endOfStartDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 0, 0);
    if (end > endOfStartDay) end = endOfStartDay;
    const opponentPart = g.opponent ? `${g.isHome ? " vs " : " @ "}${g.opponent}` : "";
    const label = `${g.teamLabel}${opponentPart}`;
    return {
      title: label,
      tooltip: `${label} — ${timeFormatter.format(start)} CT`,
      start,
      end,
      resource: g,
    };
  });
}

// One small chip per team per day that has a game, shown in the all-day
// strip above the time grid — a quick "what's on today" summary that
// doesn't require reading the (now text-free) timed blocks below.
function buildDaySummaryChips(games: Game[]): CalEvent[] {
  const seen = new Map<string, Game>();
  for (const g of games) {
    const start = toZonedTime(new Date(g.startUtc), CENTRAL_TZ);
    const key = `${centralDayKey(start)}-${g.team}`;
    if (!seen.has(key)) seen.set(key, g);
  }
  return [...seen.values()].map((g) => {
    const start = toZonedTime(new Date(g.startUtc), CENTRAL_TZ);
    const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    return {
      title: g.teamLabel,
      tooltip: `${g.teamLabel} plays today`,
      start: dayStart,
      end: dayStart,
      allDay: true,
      isSummary: true,
      resource: g,
    };
  });
}

function WeekEventContent({ event }: { event: CalEvent }) {
  if (event.isSummary) {
    return <span>{TEAMS[event.resource.team].shortLabel}</span>;
  }
  return null; // timed block: color conveys the team, no label needed
}

export function CalendarView({ games }: { games: Game[] }) {
  const [view, setView] = useState<View>("month");
  const [selected, setSelected] = useState<Game | null>(null);

  const timedEvents = useMemo(() => buildTimedEvents(games), [games]);
  const summaryChips = useMemo(() => buildDaySummaryChips(games), [games]);
  const events = view === "week" ? [...timedEvents, ...summaryChips] : timedEvents;

  return (
    <div className="calendar-wrap">
      {selected && (
        <div className="event-detail-bar" style={{ borderColor: selected.color }}>
          <span className="swatch" style={{ backgroundColor: selected.color }} />
          <span>
            <strong>{selected.teamLabel}</strong>
            {selected.opponent ? `${selected.isHome ? " vs " : " @ "}${selected.opponent}` : ""} —{" "}
            {timeFormatter.format(toZonedTime(new Date(selected.startUtc), CENTRAL_TZ))} CT
            {selected.venue ? ` — ${selected.venue}` : ""}
          </span>
          <button aria-label="Close" onClick={() => setSelected(null)}>
            ×
          </button>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        tooltipAccessor="tooltip"
        style={{ height: "75vh" }}
        popup
        views={["month", "week", "agenda"]}
        view={view}
        onView={setView}
        onSelectEvent={(event) => setSelected((event as CalEvent).resource)}
        components={{ week: { event: WeekEventContent } }}
        eventPropGetter={(event) => {
          const e = event as CalEvent;
          return {
            style: { backgroundColor: e.resource.color, borderColor: e.resource.color },
            className: e.isSummary ? "day-summary-chip" : undefined,
          };
        }}
      />
    </div>
  );
}
