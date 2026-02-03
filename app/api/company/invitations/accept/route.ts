import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepter une invitation à rejoindre une entreprise
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour accepter une invitation" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token d'invitation manquant" },
        { status: 400 }
      );
    }

    // Hasher le token pour le comparer
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Trouver l'invitation
    const invitation = await (prisma as any).companyInvitation.findFirst({
      where: {
        tokenHash,
        status: "PENDING",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée ou déjà utilisée" },
        { status: 404 }
      );
    }

    // Vérifier l'expiration
    if (new Date() > new Date(invitation.expiresAt)) {
      await (prisma as any).companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 400 }
      );
    }

    // Vérifier que l'email correspond à l'utilisateur connecté
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        companyId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Cette invitation n'est pas destinée à votre adresse email" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà membre d'une entreprise
    if (user.companyId) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre d'une entreprise" },
        { status: 400 }
      );
    }

    // Ajouter l'utilisateur à l'entreprise
    await (prisma as any).user.update({
      where: { id: session.userId },
      data: {
        companyId: invitation.companyId,
      },
    });

    // Marquer l'invitation comme acceptée
    await (prisma as any).companyInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Vous avez rejoint l'entreprise avec succès",
      companyName: invitation.company.name,
    });
  } catch (error: any) {
    console.error("[company/invitations/accept] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de l'invitation" },
      { status: 500 }
    );
  }
}

