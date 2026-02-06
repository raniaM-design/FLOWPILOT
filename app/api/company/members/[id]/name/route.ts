import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mettre à jour le nom d'un membre de l'entreprise (admin uniquement)
 * PUT /api/company/members/[id]/name
 */
export async function PUT(
  request: NextRequest,
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

    const { id: memberId } = await params;
    const { name } = await request.json();

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
        { error: "Vous devez être administrateur de l'entreprise pour modifier les noms" },
        { status: 403 }
      );
    }

    // Vérifier que le membre appartient à la même entreprise
    const member = await (prisma as any).user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        companyId: true,
        email: true,
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
        { error: "Ce membre n'appartient pas à votre entreprise" },
        { status: 403 }
      );
    }

    // Mettre à jour le nom (peut être null pour supprimer le nom)
    const updatedMember = await (prisma as any).user.update({
      where: { id: memberId },
      data: {
        name: name?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      message: "Nom mis à jour avec succès",
      member: updatedMember,
    });
  } catch (error: any) {
    console.error("[company/members/[id]/name] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du nom" },
      { status: 500 }
    );
  }
}

