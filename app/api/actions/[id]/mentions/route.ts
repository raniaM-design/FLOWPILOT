import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

/**
 * Mettre à jour les mentions d'une action
 * PUT /api/actions/[id]/mentions
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

    // Vérifier que l'action existe et que l'utilisateur y a accès
    const action = await (prisma as any).actionItem.findFirst({
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

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet
    const hasAccess = await canAccessProject(userId, action.project.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer toutes les mentions existantes
    await (prisma as any).actionMention.deleteMany({
      where: {
        actionId: id,
      },
    });

    // Créer les nouvelles mentions
    if (mentionedUserIds.length > 0) {
      await (prisma as any).actionMention.createMany({
        data: mentionedUserIds.map((userId: string) => ({
          actionId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // Revalider les pages concernées
    revalidatePath(`/app/actions`);
    if (action.decisionId) {
      revalidatePath(`/app/decisions/${action.decisionId}`);
    }
    if (action.projectId) {
      revalidatePath(`/app/projects/${action.projectId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des mentions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des mentions" },
      { status: 500 }
    );
  }
}

/**
 * Récupérer les mentions d'une action
 * GET /api/actions/[id]/mentions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    // Vérifier que l'action existe et que l'utilisateur y a accès
    let action;
    try {
      action = await (prisma as any).actionItem.findFirst({
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
        action = await (prisma as any).actionItem.findFirst({
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

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet
    const hasAccess = await canAccessProject(userId, action.project.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      mentionedUserIds: action.mentions.map((m: any) => m.userId),
      users: action.mentions.map((m: any) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name || null,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des mentions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mentions" },
      { status: 500 }
    );
  }
}

