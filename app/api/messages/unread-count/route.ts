import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages/unread-count
 * Retourne le nombre de messages non lus
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const count = await prisma.message.count({
      where: {
        userId: session.userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("[messages/unread-count] Erreur:", error);
    
    // Gestion spécifique des erreurs de connexion Prisma
    if (error.code === "P1001" || error.message?.includes("Can't reach database server")) {
      console.error("[messages/unread-count] Erreur de connexion à la base de données:", {
        code: error.code,
        message: error.message,
        databaseUrl: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 50) + "..." : 
          "not set",
      });
      
      return NextResponse.json(
        { 
          error: "Base de données indisponible",
          details: "Impossible de se connecter à la base de données. Veuillez réessayer dans quelques instants.",
          hint: "La base de données Neon peut être en mode veille. Elle se réveillera automatiquement lors de la prochaine requête."
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Autres erreurs Prisma
    if (error.code?.startsWith("P")) {
      console.error("[messages/unread-count] Erreur Prisma:", {
        code: error.code,
        message: error.message,
      });
      
      return NextResponse.json(
        { 
          error: "Erreur de base de données",
          details: "Une erreur est survenue lors de l'accès à la base de données.",
          code: error.code
        },
        { status: 500 }
      );
    }
    
    // Erreur générique
    return NextResponse.json(
      { error: "Erreur lors du comptage des messages" },
      { status: 500 }
    );
  }
}

