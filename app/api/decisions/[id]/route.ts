import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

/**
 * DELETE /api/decisions/[id]
 * Supprime une décision
 * Les actions liées seront dissociées (decisionId = null) grâce à onDelete: SetNull
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const { id } = await params;

    // Vérifier que la décision existe et que l'utilisateur est le créateur
    const decision = await prisma.decision.findFirst({
      where: {
        id,
        createdById: userId,
        project: {
          ownerId: userId, // L'utilisateur doit être propriétaire du projet
        },
      },
      include: {
        actions: {
          select: { id: true },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: "Décision non trouvée" }, { status: 404 });
    }

    // Supprimer la décision uniquement si elle appartient à l'utilisateur
    // Les actions seront automatiquement dissociées (decisionId = null) grâce à onDelete: SetNull
    const result = await prisma.decision.deleteMany({
      where: {
        id,
        createdById: userId,
        project: {
          ownerId: userId,
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Décision non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      actionsCount: decision.actions.length, // Nombre d'actions dissociées
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la décision:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

