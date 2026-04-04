import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";
import { sendStandupReminderEmail } from "@/lib/email";
import { sendStandupMissedWebPush } from "@/lib/standup/send-standup-web-push";
import {
  calendarDayKeyInTz,
  isAtOrPastReminder,
} from "@/lib/standup/calendar";

export type StandupReminderSummary = {
  usersChecked: number;
  reminded: number;
  emailsSent: number;
};

const DEFAULT_TZ = "Europe/Paris";

/**
 * À appeler depuis un cron : utilisateurs dont l’heure locale a dépassé le rappel
 * et qui n’ont pas enregistré de standup pour le jour calendaire courant (dans leur fuseau).
 */
export async function runStandupMissedReminders(
  now = new Date(),
): Promise<StandupReminderSummary> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      standupReminderHour: true,
      standupReminderMinute: true,
      standupTimezone: true,
      notifyStandupReminderEnabled: true,
      notifyStandupEmailEnabled: true,
      notifyStandupPushEnabled: true,
    },
  });

  let reminded = 0;
  let emailsSent = 0;

  for (const u of users) {
    if (!u.notifyStandupReminderEnabled) continue;

    const tz = u.standupTimezone || DEFAULT_TZ;
    const dayKey = calendarDayKeyInTz(now, tz);

    const done = await prisma.standupCompletion.findUnique({
      where: {
        userId_calendarDay: { userId: u.id, calendarDay: dayKey },
      },
    });
    if (done) continue;

    if (
      !isAtOrPastReminder(
        now,
        u.standupReminderHour,
        u.standupReminderMinute,
        tz,
      )
    ) {
      continue;
    }

    const dedupeKey = `standup_missed_reminder:${u.id}:${dayKey}`;

    const { created } = await createNotification({
      userId: u.id,
      kind: "standup_reminder",
      priority: "normal",
      title: "Standup non fait",
      body: "Tu n’as pas encore fait ton standup ce matin. Prends 2 minutes pour lancer ta journée.",
      targetUrl: "/standup",
      dedupeKey,
    });

    if (created) {
      reminded++;
      if (u.notifyStandupEmailEnabled) {
        try {
          await sendStandupReminderEmail(u.email, u.name);
          emailsSent++;
        } catch (e) {
          console.error("[standup-reminder] email failed", u.id, e);
        }
      }
      if (u.notifyStandupPushEnabled) {
        await sendStandupMissedWebPush(u.id);
      }
    }
  }

  return { usersChecked: users.length, reminded, emailsSent };
}
