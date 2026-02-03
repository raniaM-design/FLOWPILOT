import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Retirer un membre de l'entreprise (admin uniquement)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est admin de son entreprise
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: {
        companyId: true,
        isCompanyAdmin: true,
      },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre d'une entreprise" },
        { status: 403 }
      );
    }

    if (!user.isCompanyAdmin) {
      return NextResponse.json(
        { error: "Vous devez être administrateur de l'entreprise pour retirer des membres" },
        { status: 403 }
      );
    }

    // Vérifier que le membre existe et fait partie de la même entreprise
    const member = await (prisma as any).user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        companyId: true,
        isCompanyAdmin: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    if (member.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Ce membre ne fait pas partie de votre entreprise" },
        { status: 403 }
      );
    }

    // Empêcher de se retirer soi-même
    if (member.id === session.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous retirer vous-même de l'entreprise" },
        { status: 400 }
      );
    }

    // Empêcher de retirer un autre admin (optionnel - vous pouvez modifier cette logique)
    // Pour l'instant, on permet de retirer n'importe quel membre non-admin

    // Retirer le membre de l'entreprise
    await (prisma as any).user.update({
      where: { id: memberId },
      data: {
        companyId: null,
        isCompanyAdmin: false,
      },
    });

    return NextResponse.json({
      message: "Membre retiré avec succès",
    });
  } catch (error: any) {
    console.error("[company/members/remove] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait du membre" },
      { status: 500 }
    );
  }
}

