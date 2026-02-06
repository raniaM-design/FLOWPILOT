import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

/**
 * DELETE /api/decisions/[id]
 * Supprime une décision
 * Les actions liées seront dissociées (decisionId = null) grâce à onDelete: SetNull
 * Permissions : l'utilisateur doit avoir accès au projet (propriétaire ou membre de l'entreprise)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const { id } = await params;

    // Vérifier que la décision existe
    const decision = await prisma.decision.findFirst({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
        actions: {
          select: { id: true },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: "Décision non trouvée" }, { status: 404 });
    }

    // Vérifier l'accès au projet (propriétaire ou membre de l'entreprise)
    const hasAccess = await canAccessProject(userId, decision.project.id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions pour supprimer cette décision" },
        { status: 403 }
      );
    }

    // Supprimer la décision
    // Les actions seront automatiquement dissociées (decisionId = null) grâce à onDelete: SetNull
    await prisma.decision.delete({
      where: {
        id,
      },
    });

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

