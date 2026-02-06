import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

/**
 * Mettre à jour les mentions d'une décision
 * PUT /api/decisions/[id]/mentions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    const body = await request.json();
    const { mentionedUserIds } = body;

    if (!Array.isArray(mentionedUserIds)) {
      return NextResponse.json(
        { error: "mentionedUserIds doit être un tableau" },
        { status: 400 }
      );
    }

    // Vérifier que la décision existe et que l'utilisateur y a accès
    const decision = await (prisma as any).decision.findFirst({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!decision) {
      return NextResponse.json(
        { error: "Décision non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet
    const hasAccess = await canAccessProject(userId, decision.project.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer toutes les mentions existantes
    await (prisma as any).decisionMention.deleteMany({
      where: {
        decisionId: id,
      },
    });

    // Créer les nouvelles mentions
    if (mentionedUserIds.length > 0) {
      await (prisma as any).decisionMention.createMany({
        data: mentionedUserIds.map((userId: string) => ({
          decisionId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // Revalider les pages concernées
    revalidatePath(`/app/decisions/${id}`);
    revalidatePath(`/app/projects/${decision.project.id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour des mentions:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des mentions", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Récupérer les mentions d'une décision
 * GET /api/decisions/[id]/mentions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    // Vérifier que la décision existe et que l'utilisateur y a accès
    let decision;
    try {
      decision = await (prisma as any).decision.findFirst({
        where: {
          id,
        },
        include: {
          project: {
            select: {
              id: true,
            },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      // Si le champ name n'existe pas encore, réessayer sans
      if (error.message?.includes("name") || error.code === "P2009") {
        decision = await (prisma as any).decision.findFirst({
          where: {
            id,
          },
          include: {
            project: {
              select: {
                id: true,
              },
            },
            mentions: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      } else {
        throw error;
      }
    }

    if (!decision) {
      return NextResponse.json(
        { error: "Décision non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet OU si l'utilisateur est mentionné
    const hasProjectAccess = await canAccessProject(userId, decision.project.id);
    const isMentioned = decision.mentions?.some((m: any) => m.userId === userId) || false;
    
    if (!hasProjectAccess && !isMentioned) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      mentionedUserIds: decision.mentions.map((m: any) => m.userId),
      users: decision.mentions.map((m: any) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name || null,
      })),
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des mentions:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mentions", details: error.message },
      { status: 500 }
    );
  }
}

