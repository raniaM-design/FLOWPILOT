import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lister les collaborateurs invités sur une décision
 */
export async function GET(
  request: Request,
  { params }: { params: { decisionId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { decisionId } = params;

    const decision = await (prisma as any).decision.findUnique({
      where: { id: decisionId },
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

    if (!decision) {
      return NextResponse.json(
        { error: "Décision non trouvée" },
        { status: 404 }
      );
    }

    if (decision.createdById !== session.userId && decision.project.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const invitations = await (prisma as any).decisionInvitation.findMany({
      where: { decisionId },
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
    console.error("[decisions/collaborators] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des collaborateurs" },
      { status: 500 }
    );
  }
}

