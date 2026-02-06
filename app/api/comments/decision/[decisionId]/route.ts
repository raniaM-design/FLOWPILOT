import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comments/decision/[decisionId]
 * Récupérer tous les commentaires d'une décision
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { decisionId } = await params;

    // Vérifier l'accès à la décision
    const decision = await (prisma as any).decision.findFirst({
      where: { id: decisionId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!decision) {
      return NextResponse.json(
        { error: "Décision non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet OU si l'utilisateur est mentionné
    const hasAccess = await canAccessProject(session.userId, decision.projectId) ||
                      (await (prisma as any).decisionMention.count({
                        where: {
                          decisionId: decisionId,
                          userId: session.userId,
                        },
                      })) > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les commentaires
    let comments;
    try {
      comments = await (prisma as any).comment.findMany({
        where: {
          decisionId: decisionId,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (prismaError: any) {
      console.error("[comments/decision] Erreur Prisma lors de la récupération:", prismaError);
      // Si le modèle n'existe pas encore, retourner un tableau vide
      if (prismaError.code === "P2001" || prismaError.message?.includes("does not exist") || prismaError.message?.includes("Unknown model")) {
        console.warn("[comments/decision] Modèle Comment non trouvé, retour d'un tableau vide");
        comments = [];
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("[comments/decision] Erreur lors de la récupération des commentaires:", error);
    console.error("[comments/decision] Stack:", error.stack);
    console.error("[comments/decision] Code:", error.code);
    
    // Message d'erreur plus détaillé
    let errorMessage = "Erreur lors de la récupération des commentaires";
    if (error.message?.includes("Unknown model") || error.message?.includes("does not exist")) {
      errorMessage = "Le modèle Comment n'est pas disponible. Veuillez régénérer le client Prisma avec 'npx prisma generate'";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message, code: error.code },
      { status: 500 }
    );
  }
}

