import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inviter un utilisateur à collaborer sur une action
 */
export async function POST(
  request: Request,
  { params }: { params: { actionId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { actionId } = params;
    const { inviteeId } = await request.json();

    if (!inviteeId) {
      return NextResponse.json(
        { error: "ID de l'utilisateur invité requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'action existe et appartient à l'utilisateur
    const action = await (prisma as any).actionItem.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        title: true,
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

    // Vérifier les permissions (créateur ou propriétaire du projet)
    if (action.createdById !== session.userId && action.project.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission d'inviter sur cette action" },
        { status: 403 }
      );
    }

    // Vérifier que l'invité existe et fait partie de la même entreprise
    const inviter = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { companyId: true, email: true },
    });

    const invitee = await (prisma as any).user.findUnique({
      where: { id: inviteeId },
      select: { companyId: true, email: true },
    });

    if (!invitee) {
      return NextResponse.json(
        { error: "Utilisateur invité non trouvé" },
        { status: 404 }
      );
    }

    if (!inviter?.companyId || !invitee.companyId || inviter.companyId !== invitee.companyId) {
      return NextResponse.json(
        { error: "Vous ne pouvez inviter que des membres de votre entreprise" },
        { status: 403 }
      );
    }

    // Vérifier si l'invitation existe déjà
    const existingInvitation = await (prisma as any).actionInvitation.findUnique({
      where: {
        actionId_inviteeId: {
          actionId,
          inviteeId,
        },
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Cet utilisateur a déjà accepté l'invitation" },
          { status: 400 }
        );
      }
      // Réactiver l'invitation si elle était refusée
      await (prisma as any).actionInvitation.update({
        where: { id: existingInvitation.id },
        data: { status: "PENDING" },
      });
    } else {
      // Créer l'invitation
      await (prisma as any).actionInvitation.create({
        data: {
          actionId,
          inviterId: session.userId,
          inviteeId,
          status: "PENDING",
        },
      });
    }

    // Créer une notification pour l'invité
    await createNotification({
      userId: inviteeId,
      kind: "action_assigned",
      priority: "normal",
      title: "Invitation à collaborer sur une action",
      body: `${inviter.email} vous a invité à collaborer sur l'action "${action.title}"`,
      targetUrl: `/app/projects/${action.projectId}?actionId=${actionId}`,
      dedupeKey: `action_invitation:${actionId}:${inviteeId}`,
    });

    return NextResponse.json({
      message: "Invitation envoyée avec succès",
    });
  } catch (error: any) {
    console.error("[actions/invite] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    );
  }
}

