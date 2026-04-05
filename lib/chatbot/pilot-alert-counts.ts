import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export type PilotAlertCounts = {
  overdueActions: number;
  decisionsWithoutActionsThisMonth: number;
  proactiveAlertCount: number;
};

/**
 * Compteurs badge Pilot + message d’accueil (alignés sur le layout app).
 */
export async function getPilotAlertCounts(userId: string): Promise<PilotAlertCounts> {
  const projectsWhere = await getAccessibleProjectsWhere(userId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [overdueActions, decisionsWithoutActionsThisMonth] = await Promise.all([
    prisma.actionItem.count({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        dueDate: { lt: todayStart },
        project: projectsWhere,
      },
    }),
    prisma.decision.count({
      where: {
        project: projectsWhere,
        createdAt: { gte: startOfMonth },
        actions: { none: {} },
      },
    }),
  ]);

  return {
    overdueActions,
    decisionsWithoutActionsThisMonth,
    proactiveAlertCount: overdueActions + decisionsWithoutActionsThisMonth,
  };
}
