/**
 * Utilitaires pour la gestion des administrateurs
 */

import { NextResponse } from "next/server";
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

/**
 * Vérifie l'authentification admin pour les routes API
 */
export async function requireAdmin() {
  const { getSession } = await import("./session");
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 }
      ),
    };
  }
  return { session };
}

/**
 * Liste des utilisateurs pour l'administration
 */
export async function getUsersForAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      preferredLanguage: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          createdDecisions: true,
          createdActions: true,
          meetings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

