import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Promouvoir ou rétrograder un membre admin de l'entreprise
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

    const { memberId, isAdmin } = await request.json();

    if (!memberId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "ID du membre et statut admin requis" },
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
        { error: "Vous devez être administrateur de l'entreprise pour modifier les rôles" },
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

    // Empêcher de se rétrograder soi-même
    if (member.id === session.userId && !isAdmin) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous rétrograder vous-même" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut admin
    await (prisma as any).user.update({
      where: { id: memberId },
      data: {
        isCompanyAdmin: isAdmin,
      },
    });

    return NextResponse.json({
      message: isAdmin ? "Membre promu administrateur" : "Membre rétrogradé",
    });
  } catch (error: any) {
    console.error("[company/members/promote] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du rôle" },
      { status: 500 }
    );
  }
}

