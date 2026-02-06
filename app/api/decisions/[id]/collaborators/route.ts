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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: decisionId } = await params;

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

    // Vérifier si l'utilisateur est mentionné sur cette décision
    const isMentioned = await (prisma as any).decisionMention.findFirst({
      where: {
        decisionId,
        userId: session.userId,
      },
    });

    // Accès autorisé si : créateur, propriétaire du projet, OU mentionné
    const hasAccess = 
      decision.createdById === session.userId || 
      decision.project.ownerId === session.userId ||
      !!isMentioned;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Essayer d'abord avec le champ name, puis sans si erreur
    let invitations;
    try {
      invitations = await (prisma as any).decisionInvitation.findMany({
        where: { decisionId },
        include: {
          invitee: {
            select: {
              id: true,
              email: true,
              name: true,
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
    } catch (error: any) {
      // Si le champ name n'existe pas encore, réessayer sans
      if (error.message?.includes("name") || error.code === "P2009") {
        invitations = await (prisma as any).decisionInvitation.findMany({
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
      } else {
        throw error;
      }
    }

    const collaborators = invitations.map((inv: any) => ({
      id: inv.invitee.id,
      email: inv.invitee.email,
      name: inv.invitee.name || null,
      status: inv.status,
      inviterEmail: inv.inviter.email,
    }));

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    console.error("[decisions/collaborators] Erreur:", error);
    console.error("[decisions/collaborators] Stack:", error.stack);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des collaborateurs", details: error.message },
      { status: 500 }
    );
  }
}

