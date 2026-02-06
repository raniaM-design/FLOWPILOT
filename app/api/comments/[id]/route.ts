import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comments/[id]
 * Récupérer un commentaire spécifique
 */
export async function GET(
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

    const { id } = await params;

    const comment = await (prisma as any).comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("[comments] Erreur lors de la récupération du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du commentaire", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/comments/[id]
 * Mettre à jour un commentaire
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

    const { id } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du commentaire est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const existingComment = await (prisma as any).comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    if (existingComment.authorId !== session.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce commentaire" },
        { status: 403 }
      );
    }

    // Mettre à jour le commentaire
    const comment = await (prisma as any).comment.update({
      where: { id },
      data: {
        content: content.trim(),
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
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("[comments] Erreur lors de la mise à jour du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du commentaire", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * Supprimer un commentaire
 */
export async function DELETE(
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

    const { id } = await params;

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const existingComment = await (prisma as any).comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    if (existingComment.authorId !== session.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer ce commentaire" },
        { status: 403 }
      );
    }

    // Supprimer le commentaire
    await (prisma as any).comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[comments] Erreur lors de la suppression du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du commentaire", details: error.message },
      { status: 500 }
    );
  }
}

