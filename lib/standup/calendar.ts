/**
 * Jours calendaires et fenêtres horaires dans un fuseau IANA (standup).
 */

export function calendarDayKeyInTz(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Jour civil précédent (YYYY-MM-DD), calendrier grégorien — cohérent avec les clés IANA. */
export function gregorianMinusOneDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = Date.UTC(y, m - 1, d);
  return new Date(u - 86400000).toISOString().slice(0, 10);
}

function clockMinutesInTz(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(instant);
  const hour = parseInt(
    parts.find((p) => p.type === "hour")?.value ?? "0",
    10,
  );
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );
  return hour * 60 + minute;
}

/** Fenêtre [startHour:00, endHour:59] dans le fuseau (ex. 7–10 → jusqu’à 10h59). */
export function isWithinStandupWindow(
  instant: Date,
  startHour: number,
  endHour: number,
  timeZone: string,
): boolean {
  const t = clockMinutesInTz(instant, timeZone);
  const start = startHour * 60;
  const end = endHour * 60 + 59;
  return t >= start && t <= end;
}

export function isAtOrPastReminder(
  instant: Date,
  reminderHour: number,
  reminderMinute: number,
  timeZone: string,
): boolean {
  const t = clockMinutesInTz(instant, timeZone);
  return t >= reminderHour * 60 + reminderMinute;
}
