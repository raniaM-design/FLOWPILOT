import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lister les membres de la même entreprise que l'utilisateur
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'entreprise de l'utilisateur
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ members: [] });
    }

    // Récupérer tous les membres de l'entreprise
    const members = await (prisma as any).user.findMany({
      where: {
        companyId: user.companyId,
        id: { not: session.userId }, // Exclure l'utilisateur actuel
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("[company/members] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres" },
      { status: 500 }
    );
  }
}

