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
    // Essayer d'abord avec tous les champs (name et isCompanyAdmin), puis sans si erreur
    let members;
    try {
      members = await (prisma as any).user.findMany({
        where: {
          companyId: user.companyId,
          id: { not: session.userId }, // Exclure l'utilisateur actuel
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isCompanyAdmin: true, // Inclure isCompanyAdmin
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error: any) {
      // Si le champ name ou isCompanyAdmin n'existe pas encore, réessayer sans
      if (error.message?.includes("name") || error.message?.includes("isCompanyAdmin") || error.code === "P2009" || error.code === "P2022") {
        try {
          members = await (prisma as any).user.findMany({
            where: {
              companyId: user.companyId,
              id: { not: session.userId },
            },
            select: {
              id: true,
              email: true,
              role: true,
              isCompanyAdmin: true, // Essayer quand même avec isCompanyAdmin
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          });
          // Ajouter name: null pour chaque membre
          members = members.map((m: any) => ({ ...m, name: null }));
        } catch (retryError: any) {
          // Si isCompanyAdmin cause encore une erreur, réessayer sans
          if (retryError.message?.includes("isCompanyAdmin") || retryError.code === "P2022") {
            members = await (prisma as any).user.findMany({
              where: {
                companyId: user.companyId,
                id: { not: session.userId },
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
            // Ajouter name: null et isCompanyAdmin: false pour chaque membre
            members = members.map((m: any) => ({ ...m, name: null, isCompanyAdmin: false }));
          } else {
            throw retryError;
          }
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("[company/members] Erreur:", error);
    console.error("[company/members] Stack:", error.stack);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres", details: error.message },
      { status: 500 }
    );
  }
}

