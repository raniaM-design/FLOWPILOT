import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isAdmin } from "@/lib/flowpilot-auth/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour changer le rôle de l'utilisateur actuel
 * Seuls les admins peuvent changer leur propre rôle
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

    // Seuls les admins peuvent changer de rôle
    const userIsAdmin = await isAdmin(session.userId);
    if (!userIsAdmin) {
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
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: newRole },
    });

    return NextResponse.json({
      message: `Rôle changé en ${newRole}`,
      role: newRole,
    });
  } catch (error: any) {
    console.error("[user/switch-role] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de rôle" },
      { status: 500 }
    );
  }
}

