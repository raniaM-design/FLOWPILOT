import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export type ChatbotUserContext = {
  firstName: string;
  overdueCount: number;
};

/**
 * Contexte serveur pour le chat Pilot (prénom + retards), aligné sur le layout app.
 */
export async function getChatbotUserContext(userId: string): Promise<ChatbotUserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  let firstName = "toi";
  if (user?.name?.trim()) {
    firstName = user.name.trim().split(/\s+/)[0] ?? user.name.trim();
  } else if (user?.email) {
    const namePart = user.email.split("@")[0];
    firstName = namePart.charAt(0).toUpperCase() + namePart.slice(1).split(".")[0];
  }

  const projectsWhere = await getAccessibleProjectsWhere(userId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const overdueCount = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
      dueDate: { lt: todayStart },
      project: projectsWhere,
    },
  });

  return { firstName, overdueCount };
}
