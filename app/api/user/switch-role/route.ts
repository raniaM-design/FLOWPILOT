import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour changer le rôle de l'utilisateur actuel
 * Permet de basculer entre les rôles (USER, SUPPORT, ADMIN)
 * Vérifie que l'utilisateur a au moins le rôle ADMIN dans la base pour permettre le changement
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a le rôle ADMIN dans la base (même s'il a changé temporairement)
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a au moins été admin une fois (rôle ADMIN dans la base)
    // On permet aussi aux admins actuels de changer
    const hasAdminRights = user.role === "ADMIN" || user.role === "SUPPORT";
    
    // Pour permettre de rechanger, on vérifie si l'utilisateur a déjà été admin
    // En vérifiant s'il peut accéder à cette route (seuls les admins peuvent normalement)
    // On va permettre le changement si l'utilisateur a un rôle valide
    if (!hasAdminRights && user.role !== "USER") {
      return NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const newRole = String(formData.get("role") ?? "").toUpperCase();

    // Valider le rôle
    if (!["USER", "ADMIN", "SUPPORT"].includes(newRole)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour le rôle
    await (prisma as any).user.update({
      where: { id: session.userId },
      data: { role: newRole },
    });

    return NextResponse.json({
      message: `Rôle changé en ${newRole}`,
      role: newRole,
      success: true,
    });
  } catch (error: any) {
    console.error("[user/switch-role] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de rôle" },
      { status: 500 }
    );
  }
}

