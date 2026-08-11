import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Game } from "../types";

const CENTRAL_TZ = "America/Chicago";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

interface CalEvent extends Event {
  resource: Game;
}

export function CalendarView({ games }: { games: Game[] }) {
  const events: CalEvent[] = useMemo(
    () =>
      games.map((g) => {
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
        return {
          title: `${g.teamLabel}${opponentPart}`,
          start,
          end,
          resource: g,
        };
      }),
    [games]
  );

  return (
    <div className="calendar-wrap">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "75vh" }}
        popup
        views={["month", "week", "agenda"]}
        eventPropGetter={(event) => {
          const color = (event as CalEvent).resource.color;
          return { style: { backgroundColor: color, borderColor: color } };
        }}
      />
    </div>
  );
}
