import { calendarDayKeyInTz, gregorianMinusOneDay } from "@/lib/standup/calendar";

/**
 * Série de jours consécutifs avec standup fait (jour civil dans le fuseau).
 * Si le standup n’est pas encore fait aujourd’hui, la série peut quand même
 * continuer depuis hier.
 */
export function computeStandupStreak(
  completedCalendarDays: string[],
  now: Date,
  timeZone: string,
): number {
  const todayKey = calendarDayKeyInTz(now, timeZone);
  const yesterdayKey = gregorianMinusOneDay(todayKey);
  const set = new Set(completedCalendarDays);
  let anchor: string | null = null;
  if (set.has(todayKey)) anchor = todayKey;
  else if (set.has(yesterdayKey)) anchor = yesterdayKey;
  else return 0;

  let streak = 0;
  let k: string | null = anchor;
  while (k && set.has(k)) {
    streak++;
    k = gregorianMinusOneDay(k);
  }
  return streak;
}
