import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calendarDayKeyInTz,
  isInLocalHourSlot,
  weekdayMonday0InTz,
  weekRangeFromDayKey,
} from "@/lib/standup/calendar";
import { runStandupMissedReminders } from "@/lib/standup/run-standup-reminders";
import { buildDailyDigestForUser, buildWeeklyDigestForUser } from "@/lib/notifications/digest-data";
import {
  sendDailyDigestEmail,
  sendWeeklyDigestEmail,
} from "@/lib/email";
import { isWebPushConfigured, sendUserWebPush } from "@/lib/standup/send-standup-web-push";

const DEFAULT_TZ = "Europe/Paris";

async function tryClaimSend(
  userId: string,
  kind: string,
  periodKey: string,
): Promise<boolean> {
  try {
    await prisma.notificationSendLog.create({
      data: { userId, kind, periodKey },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return false;
    }
    throw e;
  }
}

export type ScheduledNotificationsSummary = {
  standup: { usersChecked: number; reminded: number; emailsSent: number };
  dailyDigests: number;
  weeklyDigests: number;
  errors: number;
};

/**
 * Exécuté par le cron (ou le worker BullMQ) : standup, digests quotidien / hebdo.
 */
export async function runScheduledNotifications(
  now = new Date(),
): Promise<ScheduledNotificationsSummary> {
  const standup = await runStandupMissedReminders(now);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      standupTimezone: true,
      notifyDigestDailyEnabled: true,
      notifyDigestDailyHour: true,
      notifyDigestDailyEmail: true,
      notifyDigestDailyPush: true,
      notifyDigestWeeklyEnabled: true,
      notifyDigestWeeklyHour: true,
      notifyDigestWeeklyEmail: true,
      notifyDigestWeeklyPush: true,
    },
  });

  let dailyDigests = 0;
  let weeklyDigests = 0;
  let errors = 0;

  for (const u of users) {
    const tz = u.standupTimezone || DEFAULT_TZ;
    const todayKey = calendarDayKeyInTz(now, tz);

    try {
      if (
        u.notifyDigestDailyEnabled &&
        isInLocalHourSlot(now, u.notifyDigestDailyHour, tz)
      ) {
        const claimed = await tryClaimSend(u.id, "daily_digest", todayKey);
        if (claimed) {
          const { openCount, payload } = await buildDailyDigestForUser(u.id, now, tz);
          const weekdayRaw = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            timeZone: tz,
          }).format(now);
          const weekdayLabel =
            weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);

          if (u.notifyDigestDailyEmail) {
            await sendDailyDigestEmail(
              u.email,
              u.name,
              weekdayLabel,
              openCount,
              payload,
            );
          }

          if (u.notifyDigestDailyPush && isWebPushConfigured()) {
            await sendUserWebPush(
              u.id,
              "Pilotys · Récap du jour",
              openCount === 0
                ? "Rien d’urgent — ouvre ton récap."
                : `${openCount} action${openCount > 1 ? "s" : ""} t’attendent.`,
              "/standup",
            );
          }

          dailyDigests++;
        }
      }

      if (
        u.notifyDigestWeeklyEnabled &&
        weekdayMonday0InTz(now, tz) === 0 &&
        isInLocalHourSlot(now, u.notifyDigestWeeklyHour, tz)
      ) {
        const { mondayKey } = weekRangeFromDayKey(todayKey, tz);
        const periodKey = `weekly:${mondayKey}`;
        const claimed = await tryClaimSend(u.id, "weekly_digest", periodKey);
        if (claimed) {
          const weeklyPayload = await buildWeeklyDigestForUser(u.id, now, tz);
          if (u.notifyDigestWeeklyEmail) {
            await sendWeeklyDigestEmail(u.email, u.name, weeklyPayload);
          }
          if (u.notifyDigestWeeklyPush && isWebPushConfigured()) {
            await sendUserWebPush(
              u.id,
              "Pilotys · Bilan de la semaine",
              `${weeklyPayload.lastWeekDoneCount} terminée(s), ${weeklyPayload.upcomingPriorities.length} priorité(s).`,
              "/standup",
            );
          }
          weeklyDigests++;
        }
      }
    } catch (e) {
      errors++;
      console.error("[scheduled-notifications]", u.id, e);
    }
  }

  return { standup, dailyDigests, weeklyDigests, errors };
}
