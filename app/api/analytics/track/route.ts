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
    const body = await request.json().catch(() => ({}));
    const { path, referer } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Le chemin de la page est requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur connecté (si disponible)
    let userId = null;
    try {
      const session = await getSession();
      userId = session?.userId || null;
    } catch (sessionError) {
      // Ignorer les erreurs de session, continuer sans userId
      console.warn("[analytics/track] Erreur récupération session:", sessionError);
    }

    // Récupérer les informations de la requête
    const userAgent = request.headers.get("user-agent") || null;
    const refererHeader = request.headers.get("referer") || referer || null;
    
    // Récupérer l'IP (pour statistiques anonymes uniquement)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

    // S'assurer que la connexion Prisma est établie
    try {
      await ensurePrismaConnection(3);
    } catch (prismaError) {
      console.error("[analytics/track] Erreur connexion Prisma:", prismaError);
      // Retourner un succès pour ne pas bloquer l'application
      return NextResponse.json({ success: true, skipped: true });
    }

    // Enregistrer la vue
    try {
      await prisma.pageView.create({
        data: {
          userId,
          path,
          referer: refererHeader,
          userAgent,
          ipAddress, // Stocké pour statistiques anonymes uniquement
        },
      });
    } catch (dbError: any) {
      // Si la table n'existe pas ou autre erreur DB, logger mais ne pas bloquer
      console.error("[analytics/track] Erreur création PageView:", dbError);
      // Retourner un succès pour ne pas bloquer l'application
      return NextResponse.json({ success: true, skipped: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[analytics/track] Erreur générale:", error);
    // Ne pas bloquer l'application si le tracking échoue
    // Retourner un succès pour éviter les erreurs répétées côté client
    return NextResponse.json({ success: true, skipped: true });
  }
}

