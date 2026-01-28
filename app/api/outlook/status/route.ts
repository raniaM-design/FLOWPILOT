import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { getOutlookAccount } from "@/lib/outlook/graph";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint pour vérifier si l'utilisateur a un compte Outlook connecté
 * Retourne : connected (bool), email, lastSyncAt
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const account = await getOutlookAccount(userId);
    
    if (!account) {
      return NextResponse.json({ 
        connected: false,
        email: null,
        lastSyncAt: null,
      });
    }

    // Récupérer la dernière synchronisation depuis OutlookSyncState
    const syncState = await prisma.outlookSyncState.findUnique({
      where: { userId },
      select: { lastSyncAt: true },
    });
    
    return NextResponse.json({ 
      connected: true,
      email: account.email || null,
      lastSyncAt: syncState?.lastSyncAt || null,
      connectedAt: account.connectedAt,
    });
  } catch (error: any) {
    console.error("Erreur lors de la vérification du statut Outlook:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

