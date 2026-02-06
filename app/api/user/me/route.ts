import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/me
 * Récupérer l'ID de l'utilisateur actuel
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    return NextResponse.json({ userId: session.userId });
  } catch (error: any) {
    console.error("[user/me] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

