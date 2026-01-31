import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepter ou refuser une invitation
 */
export async function POST(
  request: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { invitationId } = params;
    const { type, response } = await request.json(); // type: "action" | "decision" | "meeting", response: "accept" | "decline"

    if (!type || !response) {
      return NextResponse.json(
        { error: "Type et réponse requis" },
        { status: 400 }
      );
    }

    if (!["accept", "decline"].includes(response)) {
      return NextResponse.json(
        { error: "Réponse invalide" },
        { status: 400 }
      );
    }

    const status = response === "accept" ? "ACCEPTED" : "DECLINED";

    // Mettre à jour l'invitation selon le type
    if (type === "action") {
      const invitation = await (prisma as any).actionInvitation.findUnique({
        where: { id: invitationId },
        select: { inviteeId: true },
      });

      if (!invitation || invitation.inviteeId !== session.userId) {
        return NextResponse.json(
          { error: "Invitation non trouvée ou accès refusé" },
          { status: 404 }
        );
      }

      await (prisma as any).actionInvitation.update({
        where: { id: invitationId },
        data: { status },
      });
    } else if (type === "decision") {
      const invitation = await (prisma as any).decisionInvitation.findUnique({
        where: { id: invitationId },
        select: { inviteeId: true },
      });

      if (!invitation || invitation.inviteeId !== session.userId) {
        return NextResponse.json(
          { error: "Invitation non trouvée ou accès refusé" },
          { status: 404 }
        );
      }

      await (prisma as any).decisionInvitation.update({
        where: { id: invitationId },
        data: { status },
      });
    } else if (type === "meeting") {
      const invitation = await (prisma as any).meetingInvitation.findUnique({
        where: { id: invitationId },
        select: { inviteeId: true },
      });

      if (!invitation || invitation.inviteeId !== session.userId) {
        return NextResponse.json(
          { error: "Invitation non trouvée ou accès refusé" },
          { status: 404 }
        );
      }

      await (prisma as any).meetingInvitation.update({
        where: { id: invitationId },
        data: { status },
      });
    } else {
      return NextResponse.json(
        { error: "Type d'invitation invalide" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Invitation ${response === "accept" ? "acceptée" : "refusée"} avec succès`,
    });
  } catch (error: any) {
    console.error("[invitations/respond] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réponse à l'invitation" },
      { status: 500 }
    );
  }
}

