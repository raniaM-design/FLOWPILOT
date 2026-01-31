import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lister les invitations en attente pour l'utilisateur actuel
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Si l'utilisateur n'a pas d'entreprise, retourner une liste vide
    // (les invitations nécessitent une entreprise pour fonctionner)
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ invitations: [] });
    }

    // Récupérer toutes les invitations en attente
    const [actionInvitations, decisionInvitations, meetingInvitations] = await Promise.all([
      (prisma as any).actionInvitation.findMany({
        where: {
          inviteeId: session.userId,
          status: "PENDING",
        },
        include: {
          action: {
            select: {
              id: true,
              title: true,
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
      }),
      (prisma as any).decisionInvitation.findMany({
        where: {
          inviteeId: session.userId,
          status: "PENDING",
        },
        include: {
          decision: {
            select: {
              id: true,
              title: true,
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
      }),
      (prisma as any).meetingInvitation.findMany({
        where: {
          inviteeId: session.userId,
          status: "PENDING",
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
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
      }),
    ]);

    const invitations = [
      ...actionInvitations.map((inv: any) => ({
        id: inv.id,
        type: "action" as const,
        entityId: inv.action.id,
        entityTitle: inv.action.title,
        inviterEmail: inv.inviter.email,
        createdAt: inv.createdAt.toISOString(),
      })),
      ...decisionInvitations.map((inv: any) => ({
        id: inv.id,
        type: "decision" as const,
        entityId: inv.decision.id,
        entityTitle: inv.decision.title,
        inviterEmail: inv.inviter.email,
        createdAt: inv.createdAt.toISOString(),
      })),
      ...meetingInvitations.map((inv: any) => ({
        id: inv.id,
        type: "meeting" as const,
        entityId: inv.meeting.id,
        entityTitle: inv.meeting.title,
        inviterEmail: inv.inviter.email,
        createdAt: inv.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ invitations });
  } catch (error: any) {
    console.error("[invitations/pending] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des invitations" },
      { status: 500 }
    );
  }
}

