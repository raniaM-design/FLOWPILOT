import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lister les collaborateurs invités sur une réunion
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

    const { id: meetingId } = await params;

    const meeting = await (prisma as any).meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        ownerId: true,
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est mentionné sur cette réunion
    const isMentioned = await (prisma as any).meetingMention.findFirst({
      where: {
        meetingId,
        userId: session.userId,
      },
    });

    // Accès autorisé si : propriétaire de la réunion, propriétaire du projet, OU mentionné
    const hasAccess = 
      meeting.ownerId === session.userId || 
      (meeting.project && meeting.project.ownerId === session.userId) ||
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
      invitations = await (prisma as any).meetingInvitation.findMany({
        where: { meetingId },
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
        invitations = await (prisma as any).meetingInvitation.findMany({
          where: { meetingId },
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
    console.error("[meetings/collaborators] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des collaborateurs" },
      { status: 500 }
    );
  }
}

