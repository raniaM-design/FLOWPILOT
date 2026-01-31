/**
 * Utilitaires pour la gestion du support utilisateurs
 */

import { prisma } from "@/lib/db";

/**
 * Vérifie si un utilisateur est support
 */
export async function isSupport(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === "SUPPORT" || user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Liste des utilisateurs pour le support (informations non confidentielles uniquement)
 */
export async function getUsersForSupport() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      preferredLanguage: true,
      createdAt: true,
      // Ne PAS inclure: passwordHash, projets, réunions, etc.
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Obtenir les informations d'un utilisateur pour le support (non confidentielles)
 */
export async function getUserInfoForSupport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      preferredLanguage: true,
      displayReduceAnimations: true,
      displayMode: true,
      displayDensity: true,
      displayTheme: true,
      createdAt: true,
      // Statistiques agrégées (sans données sensibles)
      _count: {
        select: {
          projects: true,
          createdDecisions: true,
          createdActions: true,
          meetings: true,
        },
      },
    },
  });

  return user;
}

/**
 * Réinitialiser le mot de passe d'un utilisateur (pour le support)
 */
export async function resetUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}

