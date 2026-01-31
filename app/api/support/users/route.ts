import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport, getUsersForSupport } from "@/lib/flowpilot-auth/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour lister les utilisateurs (support uniquement)
 * Retourne uniquement des informations non confidentielles
 */
export async function GET(request: Request) {
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

    const users = await getUsersForSupport();

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[support/users] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

