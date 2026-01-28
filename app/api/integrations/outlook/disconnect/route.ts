import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint POST /api/integrations/outlook/disconnect
 * Déconnecte le compte Outlook de l'utilisateur
 * Supprime les tokens et l'état de synchronisation
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Vous devez être connecté pour déconnecter Outlook" },
        { status: 401 }
      );
    }

    // Vérifier si un compte Outlook est connecté
    const account = await prisma.outlookAccount.findUnique({
      where: { userId },
      select: { id: true, email: true },
    });

    if (!account) {
      return NextResponse.json(
        { 
          error: "NotConnected", 
          message: "Aucun compte Outlook connecté",
        },
        { status: 404 }
      );
    }

    // Supprimer le compte Outlook (cascade supprime aussi les tokens)
    await prisma.outlookAccount.delete({
      where: { userId },
    });

    // Supprimer l'état de synchronisation si présent
    await prisma.outlookSyncState.deleteMany({
      where: { userId },
    });

    // Log minimaliste (sans tokens)
    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-disconnect] Disconnected Outlook account for user ${userId}`, {
        email: account.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Compte Outlook déconnecté avec succès",
    });

  } catch (error) {
    // Erreur inattendue côté serveur
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[outlook-disconnect] Unexpected server error:", errorMessage, error);
    
    return NextResponse.json(
      { 
        error: "InternalServerError", 
        message: "Une erreur interne s'est produite lors de la déconnexion Outlook",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

