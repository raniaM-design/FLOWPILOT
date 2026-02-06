import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comments
 * Créer un nouveau commentaire sur une décision ou une action
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { decisionId, actionId, content } = await request.json();

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du commentaire est requis" },
        { status: 400 }
      );
    }

    if (!decisionId && !actionId) {
      return NextResponse.json(
        { error: "Une décision ou une action doit être spécifiée" },
        { status: 400 }
      );
    }

    if (decisionId && actionId) {
      return NextResponse.json(
        { error: "Un commentaire ne peut être lié qu'à une décision OU une action" },
        { status: 400 }
      );
    }

    // Vérifier l'accès à la décision ou l'action
    if (decisionId) {
      const decision = await (prisma as any).decision.findFirst({
        where: { id: decisionId },
        select: { id: true, projectId: true },
      });

      if (!decision) {
        return NextResponse.json(
          { error: "Décision non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier l'accès au projet (simplifié, vous pouvez utiliser canAccessProject)
      // Pour l'instant, on autorise si l'utilisateur est authentifié
    }

    if (actionId) {
      const action = await (prisma as any).actionItem.findFirst({
        where: { id: actionId },
        select: { id: true, projectId: true },
      });

      if (!action) {
        return NextResponse.json(
          { error: "Action non trouvée" },
          { status: 404 }
        );
      }
    }

    // Créer le commentaire
    // Vérifier que le modèle Comment existe dans Prisma
    let comment;
    try {
      comment = await (prisma as any).comment.create({
        data: {
          decisionId: decisionId || null,
          actionId: actionId || null,
          authorId: session.userId,
          content: content.trim(),
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
      });
    } catch (prismaError: any) {
      console.error("[comments] Erreur Prisma lors de la création:", prismaError);
      // Si le modèle n'existe pas encore, suggérer de régénérer Prisma
      if (prismaError.code === "P2001" || prismaError.message?.includes("does not exist") || prismaError.message?.includes("Unknown model")) {
        throw new Error("Le modèle Comment n'existe pas encore. Veuillez régénérer le client Prisma avec 'npx prisma generate'");
      }
      throw prismaError;
    }

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("[comments] Erreur lors de la création du commentaire:", error);
    console.error("[comments] Stack:", error.stack);
    console.error("[comments] Code:", error.code);
    
    // Message d'erreur plus détaillé
    let errorMessage = "Erreur lors de la création du commentaire";
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

