import { NextRequest, NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/track
 * Enregistre une vue de page
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const body = await request.json();
    const { path, referer } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Le chemin de la page est requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur connecté (si disponible)
    const session = await getSession();
    const userId = session?.userId || null;

    // Récupérer les informations de la requête
    const userAgent = request.headers.get("user-agent") || null;
    const refererHeader = request.headers.get("referer") || referer || null;
    
    // Récupérer l'IP (pour statistiques anonymes uniquement)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

    // S'assurer que la connexion Prisma est établie
    await ensurePrismaConnection(3);

    // Enregistrer la vue
    await prisma.pageView.create({
      data: {
        userId,
        path,
        referer: refererHeader,
        userAgent,
        ipAddress, // Stocké pour statistiques anonymes uniquement
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[analytics/track] Erreur:", error);
    // Ne pas bloquer l'application si le tracking échoue
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la vue" },
      { status: 500 }
    );
  }
}

