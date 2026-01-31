import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Créer une nouvelle entreprise
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

    const { name, domain } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà une entreprise
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { companyId: true },
    });

    if (user?.companyId) {
      return NextResponse.json(
        { error: "Vous faites déjà partie d'une entreprise" },
        { status: 400 }
      );
    }

    // Créer l'entreprise
    const company = await (prisma as any).company.create({
      data: {
        name: name.trim(),
        domain: domain?.trim() || null,
        members: {
          connect: { id: session.userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        membersCount: company.members.length,
      },
    });
  } catch (error: any) {
    console.error("[company/create] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'entreprise" },
      { status: 500 }
    );
  }
}

