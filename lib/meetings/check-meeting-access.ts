import { prisma } from "@/lib/db";

/**
 * Vérifie si un utilisateur a accès à une réunion (propriétaire, mentionné, ou membre du projet/entreprise)
 */
export async function canAccessMeeting(userId: string, meetingId: string): Promise<boolean> {
  try {
    // Récupérer la réunion avec ses relations
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
      },
      select: {
        id: true,
        ownerId: true,
        projectId: true,
        project: {
          select: {
            ownerId: true,
          },
        },
        owner: {
          select: {
            companyId: true,
          },
        },
        mentions: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!meeting) {
      return false;
    }

    // 1. Propriétaire de la réunion
    if (meeting.ownerId === userId) {
      return true;
    }

    // 2. Mentionné sur la réunion
    const isMentioned = meeting.mentions.some((m) => m.userId === userId);
    if (isMentioned) {
      return true;
    }

    // 3. Propriétaire du projet associé
    if (meeting.projectId && meeting.project?.ownerId === userId) {
      return true;
    }

    // 4. Membre de la même entreprise que le propriétaire
    if (meeting.owner.companyId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user?.companyId === meeting.owner.companyId) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[check-meeting-access] Erreur:", error);
    return false;
  }
}

