import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";
import { sendDecisionsWithoutActionsWeeklyEmail } from "@/lib/email";
import {
  isStaleDecisionWithoutActions,
  shouldShowNoActionsAlert,
} from "@/lib/decisions/stale-decisions-without-actions";

/** Clé stable par semaine civile (lundi UTC) pour déduplication notification. */
function mondayUtcKey(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = x.getUTCDate() - day + (day === 0 ? -6 : 1);
  x.setUTCDate(diff);
  return x.toISOString().slice(0, 10);
}

export type StaleDecisionsNotifySummary = {
  ownersNotified: number;
  emailsSent: number;
  projectsFlagged: number;
};

/**
 * À appeler depuis le cron hebdomadaire : alerte propriétaires de projet
 * si >30 % des décisions du projet sont sans action depuis 7+ jours.
 */
export async function runWeeklyStaleDecisionsWithoutActionsNotification(): Promise<StaleDecisionsNotifySummary> {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
      decisions: {
        select: {
          createdAt: true,
          _count: { select: { actions: true } },
        },
      },
    },
  });

  type Row = { projectId: string; name: string; stale: number; total: number };
  const byOwner = new Map<string, Row[]>();
  let projectsFlagged = 0;

  for (const p of projects) {
    const total = p.decisions.length;
    if (total === 0) continue;
    const stale = p.decisions.filter((d) =>
      isStaleDecisionWithoutActions({
        createdAt: d.createdAt,
        actionCount: d._count.actions,
      }),
    ).length;
    if (!shouldShowNoActionsAlert(total, stale)) continue;
    projectsFlagged++;
    const list = byOwner.get(p.ownerId) ?? [];
    list.push({ projectId: p.id, name: p.name, stale, total });
    byOwner.set(p.ownerId, list);
  }

  const weekKey = mondayUtcKey();
  let emailsSent = 0;

  for (const [ownerId, rows] of byOwner) {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { email: true },
    });
    if (!owner?.email) continue;

    try {
      await sendDecisionsWithoutActionsWeeklyEmail(owner.email, rows);
      emailsSent++;
    } catch (e) {
      console.error("[stale-decisions-notify] Email échoué pour", ownerId, e);
    }

    await createNotification({
      userId: ownerId,
      kind: "system",
      priority: "normal",
      title: "Décisions sans actions",
      body: `Plus de 30 % de décisions sans action depuis plus de 7 jours sur ${rows.length} projet(s).`,
      targetUrl: "/app/decisions",
      dedupeKey: `stale_decisions_weekly:${ownerId}:${weekKey}`,
    });
  }

  return {
    ownersNotified: byOwner.size,
    emailsSent,
    projectsFlagged,
  };
}
