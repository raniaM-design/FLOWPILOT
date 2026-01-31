import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport } from "@/lib/flowpilot-auth/support";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour se connecter en tant qu'un autre utilisateur (impersonation)
 * Support uniquement - permet de débloquer un utilisateur
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

    // Vérifier les droits support
    const userIsSupport = await isSupport(session.userId);
    if (!userIsSupport) {
      return NextResponse.json(
        { error: "Accès refusé. Droits support requis." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const targetUserId = String(formData.get("userId") ?? "");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Créer un token de session pour l'utilisateur cible
    const impersonationToken = await signSessionToken(targetUserId);

    // Créer la réponse avec le nouveau cookie de session
    const response = NextResponse.json({
      message: `Connecté en tant que ${targetUser.email}`,
      userId: targetUserId,
      email: targetUser.email,
    });

    // Définir le cookie de session pour l'utilisateur cible
    setSessionCookie(response, impersonationToken);

    return response;
  } catch (error: any) {
    console.error("[support/impersonate] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'impersonation" },
      { status: 500 }
    );
  }
}

