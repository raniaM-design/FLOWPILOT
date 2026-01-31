import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rejoindre une entreprise existante
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

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà une entreprise
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { companyId: true, email: true },
    });

    if (user?.companyId) {
      return NextResponse.json(
        { error: "Vous faites déjà partie d'une entreprise" },
        { status: 400 }
      );
    }

    // Vérifier que l'entreprise existe
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, domain: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Si l'entreprise a un domaine, vérifier que l'email de l'utilisateur correspond
    if (company.domain) {
      const emailDomain = user.email.split("@")[1];
      if (emailDomain !== company.domain) {
        return NextResponse.json(
          { error: `Votre email doit appartenir au domaine ${company.domain}` },
          { status: 400 }
        );
      }
    }

    // Ajouter l'utilisateur à l'entreprise
    await (prisma as any).user.update({
      where: { id: session.userId },
      data: {
        companyId: company.id,
      },
    });

    return NextResponse.json({
      message: "Vous avez rejoint l'entreprise avec succès",
      company: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error: any) {
    console.error("[company/join] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la jointure de l'entreprise" },
      { status: 500 }
    );
  }
}

