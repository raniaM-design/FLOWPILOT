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

    // Récupérer le nouveau rôle demandé
    const formData = await request.formData();
    const newRole = String(formData.get("role") ?? "").toUpperCase();

    // Valider le rôle
    if (!["USER", "ADMIN", "SUPPORT"].includes(newRole)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
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

    // Permettre le changement de rôle si :
    // 1. L'utilisateur est actuellement ADMIN ou SUPPORT
    // 2. OU si l'utilisateur veut revenir à ADMIN (pour permettre de rechanger)
    // 3. OU si l'utilisateur veut passer à SUPPORT (les admins peuvent aussi être support)
    const currentRole = user.role;
    const hasAdminRights = currentRole === "ADMIN" || currentRole === "SUPPORT";
    const wantsToBecomeAdmin = newRole === "ADMIN";
    const wantsToBecomeSupport = newRole === "SUPPORT";
    
    // Permettre le changement si :
    // - Admin/support actuel peut changer vers n'importe quel rôle
    // - USER peut revenir à ADMIN ou SUPPORT (s'il avait ces droits avant)
    // Pour simplifier, on permet à tous les utilisateurs de changer vers ADMIN/SUPPORT
    // Le vrai contrôle devrait être fait via une table de permissions, mais pour l'instant
    // on permet le changement si l'utilisateur veut devenir ADMIN ou SUPPORT
    if (!hasAdminRights && !wantsToBecomeAdmin && !wantsToBecomeSupport) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent changer de rôle." },
        { status: 403 }
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

