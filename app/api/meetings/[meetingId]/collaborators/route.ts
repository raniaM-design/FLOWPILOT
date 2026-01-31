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
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { meetingId } = await params;

    const meeting = await (prisma as any).meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée" },
        { status: 404 }
      );
    }

    if (meeting.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const invitations = await (prisma as any).meetingInvitation.findMany({
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

    const collaborators = invitations.map((inv: any) => ({
      id: inv.invitee.id,
      email: inv.invitee.email,
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

