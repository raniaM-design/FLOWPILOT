import { prisma } from "@/lib/db";
import {
  calendarDayKeyInTz,
  isWithinStandupWindow,
} from "@/lib/standup/calendar";
import { computeStandupStreak } from "@/lib/standup/streak";

export type DashboardStandupInfo = {
  showStandupCta: boolean;
  completedToday: boolean;
  streak: number;
  standupHref: string;
};

const DEFAULT_TZ = "Europe/Paris";

export async function getDashboardStandupInfo(
  userId: string,
  now = new Date(),
): Promise<DashboardStandupInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      standupWindowStartHour: true,
      standupWindowEndHour: true,
      standupTimezone: true,
      standupCompletions: {
        select: { calendarDay: true },
        orderBy: { calendarDay: "desc" },
        take: 120,
      },
    },
  });

  if (!user) {
    return {
      showStandupCta: false,
      completedToday: false,
      streak: 0,
      standupHref: "/app/standup",
    };
  }

  const tz = user.standupTimezone || DEFAULT_TZ;
  const todayKey = calendarDayKeyInTz(now, tz);
  const completedToday = user.standupCompletions.some(
    (c) => c.calendarDay === todayKey,
  );

  const streak = computeStandupStreak(
    user.standupCompletions.map((c) => c.calendarDay),
    now,
    tz,
  );

  const inWindow = isWithinStandupWindow(
    now,
    user.standupWindowStartHour,
    user.standupWindowEndHour,
    tz,
  );

  const showStandupCta = inWindow && !completedToday;

  return {
    showStandupCta,
    completedToday,
    streak,
    standupHref: "/app/standup",
  };
}
