import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport, getUserInfoForSupport } from "@/lib/flowpilot-auth/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour obtenir les informations d'un utilisateur (support uniquement)
 * Retourne uniquement des informations non confidentielles
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    const userInfo = await getUserInfoForSupport(userId);

    if (!userInfo) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userInfo });
  } catch (error: any) {
    console.error("[support/users] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations utilisateur" },
      { status: 500 }
    );
  }
}

