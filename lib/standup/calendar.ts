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

export function gregorianPlusOneDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = Date.UTC(y, m - 1, d);
  return new Date(u + 86400000).toISOString().slice(0, 10);
}

/**
 * Premier instant UTC (Date) où le jour civil `calendarDay` (YYYY-MM-DD) commence dans `timeZone`.
 */
export function utcStartOfCalendarDay(calendarDay: string, timeZone: string): Date {
  const ref = Date.parse(`${calendarDay}T12:00:00.000Z`);
  let lo = ref - 36 * 3600000;
  let hi = ref + 36 * 3600000;
  while (calendarDayKeyInTz(new Date(lo), timeZone) >= calendarDay) {
    lo -= 3600000;
  }
  while (calendarDayKeyInTz(new Date(hi), timeZone) < calendarDay) {
    hi += 3600000;
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const key = calendarDayKeyInTz(new Date(mid), timeZone);
    if (key < calendarDay) lo = mid + 1;
    else hi = mid;
  }
  return new Date(lo);
}

/** Dernier milliseconde du jour civil `calendarDay` dans `timeZone` (UTC). */
export function utcEndOfCalendarDay(calendarDay: string, timeZone: string): Date {
  const next = gregorianPlusOneDay(calendarDay);
  const startNext = utcStartOfCalendarDay(next, timeZone);
  return new Date(startNext.getTime() - 1);
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

/** 0 = lundi … 6 = dimanche (fuseau IANA). */
export function weekdayMonday0InTz(instant: Date, timeZone: string): number {
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  })
    .formatToParts(instant)
    .find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[w ?? "Mon"] ?? 0;
}

/** Lundi (YYYY-MM-DD) de la semaine civile qui contient `dayKey` dans `timeZone`. */
export function mondayCalendarKeyForDay(dayKey: string, timeZone: string): string {
  let cur = dayKey;
  for (let i = 0; i < 7; i++) {
    const inst = utcStartOfCalendarDay(cur, timeZone);
    if (weekdayMonday0InTz(inst, timeZone) === 0) return cur;
    cur = gregorianMinusOneDay(cur);
  }
  return dayKey;
}

export function addCalendarDays(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = Date.UTC(y, m - 1, d) + deltaDays * 86400000;
  return new Date(u).toISOString().slice(0, 10);
}

/** Plage [lundi, dimanche] (clés calendaires) de la semaine contenant `dayKey`. */
export function weekRangeFromDayKey(
  dayKey: string,
  timeZone: string,
): { mondayKey: string; sundayKey: string } {
  const mondayKey = mondayCalendarKeyForDay(dayKey, timeZone);
  const sundayKey = addCalendarDays(mondayKey, 6);
  return { mondayKey, sundayKey };
}

/** Vrai pendant les ~30 premières minutes de l’heure `hour` locale (cron 15 min). */
export function isInLocalHourSlot(
  instant: Date,
  hour: number,
  timeZone: string,
): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(instant);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return h === hour && m < 30;
}
