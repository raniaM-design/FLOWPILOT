import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comments/action/[actionId]
 * Récupérer tous les commentaires d'une action
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { actionId } = await params;

    // Vérifier l'accès à l'action
    const action = await (prisma as any).actionItem.findFirst({
      where: { id: actionId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'accès au projet OU si l'utilisateur est mentionné
    const hasAccess = await canAccessProject(session.userId, action.projectId) ||
                      (await (prisma as any).actionMention.count({
                        where: {
                          actionId: actionId,
                          userId: session.userId,
                        },
                      })) > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les commentaires
    const comments = await (prisma as any).comment.findMany({
      where: {
        actionId: actionId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("[comments/action] Erreur lors de la récupération des commentaires:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commentaires", details: error.message },
      { status: 500 }
    );
  }
}

