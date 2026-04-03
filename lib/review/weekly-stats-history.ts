import { prisma } from "@/lib/db";
import { calculateDecisionRisk } from "@/lib/decision-risk";

export type WeeklyStatsMetricKey =
  | "decisionsTaken"
  | "actionsCompleted"
  | "actionsBlocked"
  | "actionsOverdue"
  | "decisionsAtRisk";

/** Période k=0 la plus ancienne, k=6 = fenêtre « revue » [today−7j, demain), alignée sur WeeklyReview. */
export function getRollingWeekPeriod(k: number, todayStart: Date): { start: Date; end: Date } {
  const week6End = new Date(todayStart);
  week6End.setDate(week6End.getDate() + 1);
  const week6Start = new Date(todayStart);
  week6Start.setDate(week6Start.getDate() - 7);
  if (k === 6) {
    return { start: week6Start, end: week6End };
  }
  const end = new Date(week6Start);
  end.setDate(end.getDate() - (5 - k) * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

/**
 * Séries sur 7 fenêtres de 7 jours + totaux « semaine courante » cohérents avec les comptages.
 */
export async function fetchWeeklyStatsHistory(userId: string): Promise<{
  series7: Record<WeeklyStatsMetricKey, number[]>;
  current: Record<WeeklyStatsMetricKey, number>;
  deltasVsPreviousWeek: Record<WeeklyStatsMetricKey, number>;
  snapshots: { blockedNow: number; overdueNow: number };
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const projectOwner = { ownerId: userId };

  const series7: Record<WeeklyStatsMetricKey, number[]> = {
    decisionsTaken: [],
    actionsCompleted: [],
    actionsBlocked: [],
    actionsOverdue: [],
    decisionsAtRisk: [],
  };

  const { start: oldestStart } = getRollingWeekPeriod(0, todayStart);
  const decisionsForRiskWindow = await prisma.decision.findMany({
    where: {
      project: projectOwner,
      updatedAt: { gte: oldestStart },
    },
    select: {
      updatedAt: true,
      actions: {
        select: { id: true, status: true, dueDate: true },
      },
    },
  });

  for (let k = 0; k < 7; k++) {
    const { start, end } = getRollingWeekPeriod(k, todayStart);

    const [
      decisionsTaken,
      actionsCompleted,
      actionsBlocked,
      actionsOverdue,
    ] = await Promise.all([
      prisma.decision.count({
        where: {
          createdById: userId,
          status: "DECIDED",
          createdAt: { gte: start, lt: end },
          project: projectOwner,
        },
      }),
      prisma.actionItem.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          updatedAt: { gte: start, lt: end },
          project: projectOwner,
        },
      }),
      prisma.actionItem.count({
        where: {
          assigneeId: userId,
          status: "BLOCKED",
          updatedAt: { gte: start, lt: end },
          project: projectOwner,
        },
      }),
      prisma.actionItem.count({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          dueDate: { lt: end },
          project: projectOwner,
        },
      }),
    ]);

    const decisionsAtRisk = decisionsForRiskWindow.filter(
      (d) =>
        d.updatedAt >= start &&
        d.updatedAt < end &&
        calculateDecisionRisk(d.actions).level === "RED",
    ).length;

    series7.decisionsTaken.push(decisionsTaken);
    series7.actionsCompleted.push(actionsCompleted);
    series7.actionsBlocked.push(actionsBlocked);
    series7.actionsOverdue.push(actionsOverdue);
    series7.decisionsAtRisk.push(decisionsAtRisk);
  }

  const current = {
    decisionsTaken: series7.decisionsTaken[6]!,
    actionsCompleted: series7.actionsCompleted[6]!,
    actionsBlocked: series7.actionsBlocked[6]!,
    actionsOverdue: series7.actionsOverdue[6]!,
    decisionsAtRisk: series7.decisionsAtRisk[6]!,
  };

  const deltasVsPreviousWeek = {
    decisionsTaken: series7.decisionsTaken[6]! - series7.decisionsTaken[5]!,
    actionsCompleted: series7.actionsCompleted[6]! - series7.actionsCompleted[5]!,
    actionsBlocked: series7.actionsBlocked[6]! - series7.actionsBlocked[5]!,
    actionsOverdue: series7.actionsOverdue[6]! - series7.actionsOverdue[5]!,
    decisionsAtRisk: series7.decisionsAtRisk[6]! - series7.decisionsAtRisk[5]!,
  };

  const [blockedNow, overdueNow] = await Promise.all([
    prisma.actionItem.count({
      where: {
        assigneeId: userId,
        status: "BLOCKED",
        project: projectOwner,
      },
    }),
    prisma.actionItem.count({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        dueDate: { lt: todayStart },
        project: projectOwner,
      },
    }),
  ]);

  return {
    series7,
    current,
    deltasVsPreviousWeek,
    snapshots: { blockedNow, overdueNow },
  };
}
