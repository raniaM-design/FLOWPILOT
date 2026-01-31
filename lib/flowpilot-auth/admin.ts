/**
 * Utilitaires pour la gestion des administrateurs
 */

import { prisma } from "@/lib/db";

/**
 * Vérifie si un utilisateur est administrateur
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Vérifie si un utilisateur est administrateur par email
 */
export async function isAdminByEmail(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true },
    });
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    return user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Promouvoir un utilisateur au rôle admin
 */
export async function promoteToAdmin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });
}

/**
 * Rétrograder un admin au rôle utilisateur
 */
export async function demoteFromAdmin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role: "USER" },
  });
}

