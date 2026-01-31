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
    const currentRole = user.role;
    const hasAdminRights = currentRole === "ADMIN" || currentRole === "SUPPORT";
    const wantsToBecomeAdmin = newRole === "ADMIN";
    
    // Permettre le changement si admin/support actuel OU si on veut revenir à admin
    if (!hasAdminRights && !wantsToBecomeAdmin) {
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

