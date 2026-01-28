import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

/**
 * DELETE /api/projects/[id]
 * Supprime un projet et toutes ses dépendances en cascade
 * - Les décisions seront supprimées (onDelete: Cascade)
 * - Les actions seront supprimées (onDelete: Cascade)
 * - Les réunions liées au projet (via context) ne sont PAS supprimées automatiquement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const { id } = await params;

    // Vérifier que le projet existe et que l'utilisateur est le propriétaire
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        decisions: {
          select: { id: true },
        },
        actions: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Supprimer le projet (les décisions et actions seront supprimées en cascade)
    // Utiliser deleteMany avec le filtre userId pour la sécurité
    const result = await prisma.project.deleteMany({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      decisionsCount: project.decisions.length,
      actionsCount: project.actions.length,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

