import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

/**
 * DELETE /api/meetings/[id]
 * Supprime une réunion
 * Les actions liées seront dissociées (meetingId = null) grâce à onDelete: SetNull
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const { id } = await params;

    // Vérifier que la réunion existe et que l'utilisateur est le propriétaire
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        actions: {
          select: { id: true },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    // Supprimer la réunion uniquement si elle appartient à l'utilisateur
    // Les actions seront automatiquement dissociées (meetingId = null) grâce à onDelete: SetNull
    const result = await prisma.meeting.deleteMany({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      actionsCount: meeting.actions.length, // Nombre d'actions dissociées
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la réunion:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

