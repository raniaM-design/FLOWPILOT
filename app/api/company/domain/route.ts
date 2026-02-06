import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mettre à jour le domaine de l'entreprise (admin uniquement)
 * PUT /api/company/domain
 */
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { domain } = await request.json();

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
        { error: "Vous devez être administrateur de l'entreprise pour modifier le domaine" },
        { status: 403 }
      );
    }

    // Valider le format du domaine si fourni
    let normalizedDomain: string | null = null;
    if (domain && domain.trim()) {
      const trimmedDomain = domain.trim();
      // Vérifier que c'est un vrai domaine email (contient un point et pas d'espaces)
      if (trimmedDomain.includes(".") && !trimmedDomain.includes(" ")) {
        normalizedDomain = trimmedDomain.toLowerCase();
      } else {
        return NextResponse.json(
          { error: "Le domaine doit être un domaine email valide (ex: example.com)" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le domaine de l'entreprise
    const updatedCompany = await (prisma as any).company.update({
      where: { id: user.companyId },
      data: {
        domain: normalizedDomain,
      },
      select: {
        id: true,
        name: true,
        domain: true,
      },
    });

    return NextResponse.json({
      message: normalizedDomain 
        ? `Domaine mis à jour : ${normalizedDomain}` 
        : "Domaine supprimé (aucune restriction d'email)",
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error("[company/domain] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du domaine" },
      { status: 500 }
    );
  }
}

