import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lister les collaborateurs invités sur une action
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { actionId } = await params;

    // Vérifier que l'action existe et que l'utilisateur a accès
    const action = await (prisma as any).actionItem.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        createdById: true,
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (action.createdById !== session.userId && action.project.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Récupérer les invitations
    const invitations = await (prisma as any).actionInvitation.findMany({
      where: { actionId },
      include: {
        invitee: {
          select: {
            id: true,
            email: true,
          },
        },
        inviter: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const collaborators = invitations.map((inv: any) => ({
      id: inv.invitee.id,
      email: inv.invitee.email,
      status: inv.status,
      inviterEmail: inv.inviter.email,
    }));

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    console.error("[actions/collaborators] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des collaborateurs" },
      { status: 500 }
    );
  }
}

