import type { Game } from "../src/types.js";

// Domain suffix for UID uniqueness only — doesn't need to resolve to anything.
const UID_DOMAIN = "sports-calendar.glanderson5.github.io";

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// RFC 5545: content lines should be folded at 75 octets, continuation
// lines prefixed with a single space. We fold by character count rather
// than byte count — simpler, and safe since our text is effectively ASCII.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    parts.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join("\r\n ");
}

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildEventLines(g: Game): string[] {
  const start = new Date(g.startUtc);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const summary = g.opponent ? `${g.teamLabel}${g.isHome ? " vs " : " @ "}${g.opponent}` : g.title;
  const description = [g.sport, g.result].filter((v): v is string => Boolean(v)).join(" — ");

  const raw = [
    "BEGIN:VEVENT",
    // Stable across rebuilds (ESPN/Jolpica's own event ID) — schedule
    // changes (e.g. NFL flex scheduling) update this event's time in the
    // subscriber's calendar app instead of creating a duplicate.
    `UID:${g.id}@${UID_DOMAIN}`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(g.startUtc)}`,
    `DTEND:${toIcsUtc(end.toISOString())}`,
    `SUMMARY:${escapeText(summary)}`,
    g.venue ? `LOCATION:${escapeText(g.venue)}` : null,
    description ? `DESCRIPTION:${escapeText(description)}` : null,
    "END:VEVENT",
  ].filter((l): l is string => l !== null);

  return raw.map(foldLine);
}

export function buildIcs(games: Game[], calendarName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sports Calendar//glanderson5//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    // Hints some clients honor for subscription poll frequency — not
    // universally respected (Google Calendar in particular polls on its
    // own schedule regardless), but harmless to include.
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...games.flatMap(buildEventLines),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
