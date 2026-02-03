import { prisma } from "@/lib/db";

/**
 * Récupère les IDs des membres de l'entreprise de l'utilisateur
 * Retourne un tableau contenant l'userId et les IDs des autres membres de l'entreprise
 */
export async function getCompanyMemberIds(userId: string): Promise<string[]> {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        companyId: true,
      },
    });

    if (!user?.companyId) {
      // Pas d'entreprise, retourner seulement l'utilisateur
      return [userId];
    }

    // Récupérer tous les membres de l'entreprise
    const members = await (prisma as any).user.findMany({
      where: {
        companyId: user.companyId,
      },
      select: {
        id: true,
      },
    });

    return members.map((m: any) => m.id);
  } catch (error) {
    console.error("[getCompanyMemberIds] Erreur:", error);
    // En cas d'erreur, retourner seulement l'utilisateur
    return [userId];
  }
}

/**
 * Helper pour construire une clause WHERE pour les projets accessibles
 * (projets de l'utilisateur + projets des membres de son entreprise)
 */
export async function getAccessibleProjectsWhere(userId: string) {
  const memberIds = await getCompanyMemberIds(userId);
  
  return {
    ownerId: {
      in: memberIds,
    },
  };
}

